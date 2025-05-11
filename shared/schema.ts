import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Added password field
  fullName: text("full_name").notNull(),
  companyName: text("company_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  industry: text("industry").notNull(),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  companyDescription: text("company_description"),
  companyWebsite: text("company_website"),
  productsServices: text("products_services"),
  targetMarket: text("target_market"),
  salesPitch: text("sales_pitch"),
  aiCredits: integer("ai_credits").notNull().default(0),
  role: text("role").notNull().default("customer"),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Contact model
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fullName: text("full_name").notNull(),
  companyName: text("company_name"),
  email: text("email"),
  phoneNumber: text("phone_number").notNull(),
  industry: text("industry"),
  notes: text("notes"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Campaign model
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  status: text("status").notNull().default("active"),
  description: text("description"),
  script: text("script"),
  language: text("language").notNull().default("en"),
  translationEnabled: boolean("translation_enabled").notNull().default(false),
  responseLanguage: text("response_language"),
  totalContacts: integer("total_contacts").notNull().default(0),
  callsMade: integer("calls_made").notNull().default(0),
  appointmentsSet: integer("appointments_set").notNull().default(0),
  conversionRate: text("conversion_rate").notNull().default("0%"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Call model
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contactId: integer("contact_id").notNull(),
  campaignId: integer("campaign_id"),
  status: text("status").notNull(),
  duration: integer("duration").notNull().default(0),
  recordingUrl: text("recording_url"),
  transcript: text("transcript"),
  originalTranscript: text("original_transcript"),
  language: text("language").notNull().default("en"),
  translatedTranscript: text("translated_transcript"),
  sentiment: text("sentiment"),
  followUpStatus: text("follow_up_status"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, aiCredits: true, role: true })
  .extend({
    password: z.string().min(6),
  });

export const insertContactSchema = createInsertSchema(contacts)
  .omit({ id: true, createdAt: true, userId: true });

export const insertCampaignSchema = createInsertSchema(campaigns)
  .omit({ id: true, createdAt: true, userId: true, totalContacts: true, callsMade: true, appointmentsSet: true, conversionRate: true });

export const insertCallSchema = createInsertSchema(calls)
  .omit({ id: true, createdAt: true, userId: true, duration: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;
