import { users, contacts, campaigns, calls } from "@shared/schema";
import type { User, InsertUser, Contact, InsertContact, Campaign, InsertCampaign, Call, InsertCall } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Contact operations
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByUserId(userId: number): Promise<Contact[]>;
  createContact(contact: InsertContact & { userId: number }): Promise<Contact>;
  createManyContacts(contacts: Array<InsertContact & { userId: number }>): Promise<Contact[]>;
  updateContact(id: number, contact: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Campaign operations
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaignsByUserId(userId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign & { userId: number }): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;
  
  // Call operations
  getCall(id: number): Promise<Call | undefined>;
  getCallsByUserId(userId: number): Promise<Call[]>;
  getCallsByContactId(contactId: number): Promise<Call[]>;
  getCallsByCampaignId(campaignId: number): Promise<Call[]>;
  createCall(call: InsertCall & { userId: number }): Promise<Call>;
  updateCall(id: number, call: Partial<Call>): Promise<Call | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<number, Contact>;
  private campaigns: Map<number, Campaign>;
  private calls: Map<number, Call>;
  private userIdCounter: number;
  private contactIdCounter: number;
  private campaignIdCounter: number;
  private callIdCounter: number;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.campaigns = new Map();
    this.calls = new Map();
    this.userIdCounter = 1;
    this.contactIdCounter = 1;
    this.campaignIdCounter = 1;
    this.callIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const timestamp = new Date();
    const user: User = {
      id,
      ...insertUser,
      profilePicture: null,
      aiCredits: 300, // Default 300 minutes
      role: "customer",
      createdAt: timestamp
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Contact operations
  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getContactsByUserId(userId: number): Promise<Contact[]> {
    return Array.from(this.contacts.values()).filter(contact => contact.userId === userId);
  }

  async createContact(contact: InsertContact & { userId: number }): Promise<Contact> {
    const id = this.contactIdCounter++;
    const timestamp = new Date();
    const newContact: Contact = {
      id,
      ...contact,
      createdAt: timestamp
    };
    this.contacts.set(id, newContact);
    return newContact;
  }

  async createManyContacts(contacts: Array<InsertContact & { userId: number }>): Promise<Contact[]> {
    const createdContacts: Contact[] = [];
    
    for (const contact of contacts) {
      const newContact = await this.createContact(contact);
      createdContacts.push(newContact);
    }
    
    return createdContacts;
  }

  async updateContact(id: number, contactData: Partial<Contact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = { ...contact, ...contactData };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  // Campaign operations
  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByUserId(userId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(campaign => campaign.userId === userId);
  }

  async createCampaign(campaign: InsertCampaign & { userId: number }): Promise<Campaign> {
    const id = this.campaignIdCounter++;
    const timestamp = new Date();
    const newCampaign: Campaign = {
      id,
      ...campaign,
      totalContacts: 0,
      callsMade: 0,
      appointmentsSet: 0,
      conversionRate: "0%",
      createdAt: timestamp
    };
    this.campaigns.set(id, newCampaign);
    return newCampaign;
  }

  async updateCampaign(id: number, campaignData: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, ...campaignData };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }

  // Call operations
  async getCall(id: number): Promise<Call | undefined> {
    return this.calls.get(id);
  }

  async getCallsByUserId(userId: number): Promise<Call[]> {
    return Array.from(this.calls.values()).filter(call => call.userId === userId);
  }

  async getCallsByContactId(contactId: number): Promise<Call[]> {
    return Array.from(this.calls.values()).filter(call => call.contactId === contactId);
  }

  async getCallsByCampaignId(campaignId: number): Promise<Call[]> {
    return Array.from(this.calls.values()).filter(call => call.campaignId === campaignId);
  }

  async createCall(call: InsertCall & { userId: number }): Promise<Call> {
    const id = this.callIdCounter++;
    const timestamp = new Date();
    const newCall: Call = {
      id,
      ...call,
      duration: 0,
      createdAt: timestamp
    };
    this.calls.set(id, newCall);
    return newCall;
  }

  async updateCall(id: number, callData: Partial<Call>): Promise<Call | undefined> {
    const call = this.calls.get(id);
    if (!call) return undefined;
    
    const updatedCall = { ...call, ...callData };
    this.calls.set(id, updatedCall);
    return updatedCall;
  }
}

export const storage = new MemStorage();
