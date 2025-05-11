import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertContactSchema, insertCampaignSchema, insertCallSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import session from "express-session";
import multer from "multer";
import fs from "fs";
import path from "path";
import os from "os";
import { makeOutboundCall, getCallStatus as getTwilioCallStatus, endCall as endTwilioCall, sendSms } from "./twilio";
import { transcribeAudio } from "./openai";
import { hashPassword, verifyPassword } from "./auth-utils";

// Extend Express Request to include session
declare module "express" {
  interface Request {
    session: session.SessionData;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Hash the user's password before storing it
      const hashedPassword = hashPassword(userData.password);
      
      // Create the user with the hashed password
      const userWithHashedPassword = {
        ...userData,
        password: hashedPassword
      };
      
      const user = await storage.createUser(userWithHashedPassword);
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      // Set up session for the newly registered user
      req.session.userId = user.id;
      
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Verify the password using our secure hash verification
      if (!verifyPassword(password, user.password)) {
        // Use the same error message to not leak info about existing emails
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Create session
      req.session.userId = user.id;
      
      // Set special role for michael@reachimpact.io for admin access
      let role = user.role;
      if (email === "michael@reachimpact.io") {
        role = "admin";
      }
      
      // Don't include password in the response
      return res.json({ 
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        companyName: user.companyName,
        preferredLanguage: user.preferredLanguage,
        aiCredits: user.aiCredits,
        role: role
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (req.session) {
      // Clear user ID from session
      req.session.userId = undefined;
      
      // Regenerate session
      req.session.save((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.clearCookie("connect.sid");
        return res.json({ message: "Successfully logged out" });
      });
    } else {
      res.clearCookie("connect.sid");
      return res.json({ message: "Successfully logged out" });
    }
  });

  // User profile routes
  app.get("/api/user/profile", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't expose password in response
      const { password, ...userWithoutPassword } = user as any;
      
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get user profile" });
    }
  });

  app.put("/api/user/profile", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const updateSchema = insertUserSchema.partial().omit({ password: true });
      const userData = updateSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(req.session.userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't expose password in response
      const { password, ...userWithoutPassword } = updatedUser as any;
      
      return res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Contact routes
  app.get("/api/contacts", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const contacts = await storage.getContactsByUserId(req.session.userId);
      return res.json(contacts);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get contacts" });
    }
  });

  app.post("/api/contacts", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact({
        ...contactData,
        userId: req.session.userId
      });
      
      return res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.post("/api/contacts/bulk", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const contactsArray = z.array(insertContactSchema).parse(req.body);
      
      const contacts = await storage.createManyContacts(
        contactsArray.map(contact => ({
          ...contact,
          userId: req.session.userId as number
        }))
      );
      
      return res.status(201).json(contacts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contacts data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create contacts" });
    }
  });

  app.get("/api/contacts/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const contactId = parseInt(req.params.id);
      const contact = await storage.getContact(contactId);
      
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }
      
      if (contact.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      return res.json(contact);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get contact" });
    }
  });

  // Campaign routes
  app.get("/api/campaigns", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const campaigns = await storage.getCampaignsByUserId(req.session.userId);
      return res.json(campaigns);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ message: "Invalid campaign ID" });
      }
      
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (campaign.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      return res.json(campaign);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get campaign" });
    }
  });

  app.post("/api/campaigns", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign({
        ...campaignData,
        userId: req.session.userId
      });
      
      return res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create campaign" });
    }
  });
  
  app.put("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ message: "Invalid campaign ID" });
      }
      
      // Get the campaign to verify ownership
      const existingCampaign = await storage.getCampaign(campaignId);
      
      if (!existingCampaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (existingCampaign.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Parse and validate the update data
      const updateSchema = insertCampaignSchema.partial().omit({ id: true, userId: true, createdAt: true });
      const campaignData = updateSchema.parse(req.body);
      
      // Update the campaign
      const updatedCampaign = await storage.updateCampaign(campaignId, campaignData);
      
      if (!updatedCampaign) {
        return res.status(500).json({ message: "Failed to update campaign" });
      }
      
      return res.json(updatedCampaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update campaign" });
    }
  });
  
  app.delete("/api/campaigns/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const campaignId = parseInt(req.params.id);
      if (isNaN(campaignId)) {
        return res.status(400).json({ message: "Invalid campaign ID" });
      }
      
      // Get the campaign to verify ownership
      const existingCampaign = await storage.getCampaign(campaignId);
      
      if (!existingCampaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      if (existingCampaign.userId !== req.session.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Delete the campaign
      const success = await storage.deleteCampaign(campaignId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete campaign" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Call routes
  app.get("/api/calls", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const calls = await storage.getCallsByUserId(req.session.userId);
      return res.json(calls);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get calls" });
    }
  });

  app.post("/api/calls", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const callData = insertCallSchema.parse(req.body);
      
      // Verify the contact belongs to this user
      const contact = await storage.getContact(callData.contactId);
      if (!contact || contact.userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized access to contact" });
      }
      
      const call = await storage.createCall({
        ...callData,
        userId: req.session.userId
      });
      
      return res.status(201).json(call);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid call data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create call" });
    }
  });
  
  // Twilio API Routes
  
  // Make a call using Twilio
  app.post("/api/call", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { phoneNumber, contactId, campaignId, callbackUrl, language } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      
      // Verify the contact belongs to this user if contactId is provided
      if (contactId) {
        const contact = await storage.getContact(contactId);
        if (!contact || contact.userId !== req.session.userId) {
          return res.status(403).json({ message: "Unauthorized access to contact" });
        }
      }
      
      // Make the call using Twilio
      const callStatus = await makeOutboundCall(phoneNumber, {
        callbackUrl,
        language,
        record: true,
        statusCallback: `${req.protocol}://${req.get('host')}/api/call-status-callback`,
      });
      
      // Deduct credits (in a real app, we would deduct credits here)
      // For now, we're just checking if the user has credits
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.aiCredits <= 0) {
        return res.status(402).json({ message: "Insufficient credits" });
      }
      
      return res.json(callStatus);
    } catch (error: any) {
      console.error("Error making call:", error);
      return res.status(500).json({ 
        message: "Failed to make call",
        error: error.message || "Unknown error"
      });
    }
  });
  
  // Get call status
  app.get("/api/call/:sid", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { sid } = req.params;
      
      if (!sid) {
        return res.status(400).json({ message: "Call SID is required" });
      }
      
      const callStatus = await getTwilioCallStatus(sid);
      
      return res.json(callStatus);
    } catch (error: any) {
      console.error("Error getting call status:", error);
      return res.status(500).json({ 
        message: "Failed to get call status",
        error: error.message || "Unknown error"
      });
    }
  });
  
  // End call
  app.post("/api/call/:sid/end", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { sid } = req.params;
      
      if (!sid) {
        return res.status(400).json({ message: "Call SID is required" });
      }
      
      const result = await endTwilioCall(sid);
      
      return res.json(result);
    } catch (error: any) {
      console.error("Error ending call:", error);
      return res.status(500).json({ 
        message: "Failed to end call",
        error: error.message || "Unknown error"
      });
    }
  });
  
  // Send SMS
  app.post("/api/sms", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Phone number and message are required" });
      }
      
      // Verify the user has credits
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.aiCredits <= 0) {
        return res.status(402).json({ message: "Insufficient credits" });
      }
      
      const result = await sendSms(phoneNumber, message);
      
      return res.json(result);
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      return res.status(500).json({ 
        message: "Failed to send SMS",
        error: error.message || "Unknown error"
      });
    }
  });

  // Credits/billing
  app.get("/api/credits", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({ credits: user.aiCredits });
    } catch (error) {
      return res.status(500).json({ message: "Failed to get credits" });
    }
  });

  app.post("/api/credits/add", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { amount } = req.body;
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(req.session.userId, {
        aiCredits: user.aiCredits + amount
      });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to add credits" });
      }
      
      return res.json({ credits: updatedUser.aiCredits });
    } catch (error) {
      return res.status(500).json({ message: "Failed to add credits" });
    }
  });

  // OpenAI API routes
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Chat route
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      // Extract request parameters
      const { messages, model = "gpt-4o", temperature = 0.7, max_tokens = 500 } = req.body;
      
      // Validate request
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Invalid request: messages must be an array" });
      }
      
      // Make API call to OpenAI
      const completion = await openai.chat.completions.create({
        model: model, // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
      });
      
      // Calculate token usage
      const promptTokens = completion.usage?.prompt_tokens || 0;
      const completionTokens = completion.usage?.completion_tokens || 0;
      const totalTokens = completion.usage?.total_tokens || 0;
      
      // Return response
      return res.json({
        message: {
          role: completion.choices[0].message.role,
          content: completion.choices[0].message.content,
        },
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        }
      });
    } catch (error: any) {
      console.error("OpenAI chat error:", error);
      return res.status(500).json({ 
        message: "Error processing chat request", 
        error: error.message || "Unknown error" 
      });
    }
  });

  // Sentiment analysis route
  app.post("/api/analyze-sentiment", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Invalid request: text must be a string" });
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating from 1 to 5 stars and a confidence score between 0 and 1. Respond with JSON in this format: { 'rating': number, 'confidence': number }"
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return res.json({
        rating: Math.max(1, Math.min(5, Math.round(result.rating || 3))),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
      });
    } catch (error: any) {
      console.error("OpenAI sentiment analysis error:", error);
      return res.status(500).json({ 
        message: "Error analyzing sentiment", 
        error: error.message || "Unknown error" 
      });
    }
  });

  // Contact parsing route
  app.post("/api/parse-contacts", async (req: Request, res: Response) => {
    try {
      const { content, fileType, language = "en" } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Invalid request: content must be a string" });
      }
      
      if (!fileType || (fileType !== 'csv' && fileType !== 'excel')) {
        return res.status(400).json({ message: "Invalid request: fileType must be 'csv' or 'excel'" });
      }
      
      // Create a prompt based on file type and language
      const systemPrompt = `You are an expert at parsing ${fileType === 'csv' ? 'CSV' : 'Excel'} data. 
      Extract contact information from the following content and convert it to a JSON array of objects.
      Each object should have these fields if available: fullName, email, phoneNumber, companyName, industry, notes.
      Ensure phone numbers are properly formatted. Return only the JSON array.
      The input data might be in ${language} language, please handle it appropriately.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: content
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse the response
      const jsonResponse = JSON.parse(response.choices[0].message.content || "{}");
      const contacts = Array.isArray(jsonResponse.contacts) ? jsonResponse.contacts : 
                      Array.isArray(jsonResponse) ? jsonResponse : [];
      
      return res.json(contacts);
    } catch (error: any) {
      console.error("OpenAI contact parsing error:", error);
      return res.status(500).json({ 
        message: "Error parsing contacts", 
        error: error.message || "Unknown error" 
      });
    }
  });
  
  // Multilingual chat route
  app.post("/api/multilingual-chat", async (req: Request, res: Response) => {
    try {
      // Extract request parameters
      const { 
        messages, 
        language_preference, 
        model = "gpt-4o", 
        temperature = 0.7, 
        max_tokens = 500 
      } = req.body;
      
      // Validate request
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ message: "Invalid request: messages must be an array" });
      }
      
      if (!language_preference || !language_preference.conversationLanguage || !language_preference.responseLanguage) {
        return res.status(400).json({ message: "Invalid request: language preference must be specified" });
      }
      
      const { conversationLanguage, responseLanguage, translateUserInput } = language_preference;
      
      // Create a copy of messages for processing
      let processedMessages = [...messages];
      
      // If translation is enabled, we need to translate user messages to the conversation language
      if (translateUserInput) {
        // Translate user messages to the conversation language
        const translatedMessages = await Promise.all(
          processedMessages.map(async (message) => {
            if (message.role === "user") {
              // Create a translation prompt
              const translationCompletion = await openai.chat.completions.create({
                model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
                messages: [
                  {
                    role: "system",
                    content: `You are a translator. Translate the following text from any language to ${conversationLanguage}. Preserve the original meaning, tone, and intent as closely as possible. Only return the translated text, nothing else.`
                  },
                  {
                    role: "user",
                    content: message.content
                  }
                ]
              });
              
              // Return translated message
              return {
                ...message,
                original_content: message.content,
                content: translationCompletion.choices[0].message.content || message.content
              };
            }
            return message;
          })
        );
        
        processedMessages = translatedMessages;
      }
      
      // If conversation language is different from response language, add system prompt to respond in response language
      if (conversationLanguage !== responseLanguage) {
        // Add or update system message to include language instruction
        const hasSystemMessage = processedMessages.some(msg => msg.role === "system");
        
        if (hasSystemMessage) {
          // Update existing system message
          processedMessages = processedMessages.map(msg => {
            if (msg.role === "system") {
              return {
                ...msg,
                content: `${msg.content} Please respond in ${responseLanguage}.`
              };
            }
            return msg;
          });
        } else {
          // Add a new system message
          processedMessages.unshift({
            role: "system",
            content: `Please respond in ${responseLanguage}.`
          });
        }
      }
      
      // Make API call to OpenAI with processed messages
      const completion = await openai.chat.completions.create({
        model: model, // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: processedMessages,
        temperature: temperature,
        max_tokens: max_tokens,
      });
      
      // Calculate token usage
      const promptTokens = completion.usage?.prompt_tokens || 0;
      const completionTokens = completion.usage?.completion_tokens || 0;
      const totalTokens = completion.usage?.total_tokens || 0;
      
      // Return response
      return res.json({
        message: {
          role: completion.choices[0].message.role,
          content: completion.choices[0].message.content,
        },
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        }
      });
    } catch (error: any) {
      console.error("OpenAI multilingual chat error:", error);
      return res.status(500).json({ 
        message: "Error processing multilingual chat request", 
        error: error.message || "Unknown error"
      });
    }
  });
  
  // Translation route
  app.post("/api/translate", async (req: Request, res: Response) => {
    try {
      const { text, source_language, target_language } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Invalid request: text must be a string" });
      }
      
      if (!target_language) {
        return res.status(400).json({ message: "Invalid request: target language must be specified" });
      }
      
      // Create a translation prompt based on source and target language
      const prompt = source_language
        ? `Translate the following text from ${source_language} to ${target_language}. Only return the translated text, nothing else.`
        : `Translate the following text to ${target_language}. Detect the source language automatically. Only return the translated text, nothing else.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: text
          }
        ]
      });
      
      return res.json({
        translatedText: response.choices[0].message.content,
        detectedLanguage: source_language || "auto-detected"
      });
    } catch (error: any) {
      console.error("OpenAI translation error:", error);
      return res.status(500).json({ 
        message: "Error translating text", 
        error: error.message || "Unknown error" 
      });
    }
  });
  
  // Script generation route
  app.post("/api/generate-script", async (req: Request, res: Response) => {
    try {
      const { campaign_info, language = "en" } = req.body;
      
      if (!campaign_info || !campaign_info.name || !campaign_info.industry) {
        return res.status(400).json({ message: "Invalid request: campaign information is required" });
      }
      
      const { name, industry, description } = campaign_info;
      
      // Create a script generation prompt
      const prompt = `Create a professional AI calling script for a campaign named "${name}" in the ${industry} industry.
      ${description ? `Campaign description: ${description}` : ""}
      
      The script should include:
      1. A friendly introduction that mentions the company name
      2. A brief explanation of the reason for the call
      3. Key questions to understand the contact's needs
      4. Handling of common objections
      5. A clear call-to-action or next steps
      6. A polite conclusion

      Make the script sound natural and conversational, not robotic.
      The script must be in ${language} language.
      
      Format the script with clear sections and provide any special instructions for the AI assistant in brackets.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: "You are an expert in creating effective sales and customer engagement scripts."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });
      
      return res.json({
        script: response.choices[0].message.content
      });
    } catch (error: any) {
      console.error("OpenAI script generation error:", error);
      return res.status(500).json({ 
        message: "Error generating script", 
        error: error.message || "Unknown error" 
      });
    }
  });
  
  // File upload middleware for audio files
  const multerStorage = multer.memoryStorage();
  const upload = multer({ 
    storage: multerStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
  });
  
  // Audio transcription endpoint
  app.post("/api/transcribe", upload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
      }
      
      const audioBuffer = req.file.buffer;
      
      // Use OpenAI's Whisper model for transcription
      const { transcribeAudio } = require('./openai');
      
      // Create a temporary file
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const tempFile = path.join(os.tmpdir(), `recording-${Date.now()}.webm`);
      fs.writeFileSync(tempFile, audioBuffer);
      
      try {
        // Transcribe the audio
        const transcription = await transcribeAudio(tempFile);
        
        // Clean up temporary file
        fs.unlinkSync(tempFile);
        
        // Deduct credits (in a real app)
        const user = await storage.getUser(req.session.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        if (user.aiCredits <= 0) {
          return res.status(402).json({ message: "Insufficient credits" });
        }
        
        res.json({ text: transcription.text });
      } catch (transcriptionError) {
        console.error("Transcription error:", transcriptionError);
        
        // Clean up temporary file even if there's an error
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
        
        res.status(500).json({ error: "Failed to transcribe audio" });
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      res.status(500).json({ error: "Failed to process audio file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
