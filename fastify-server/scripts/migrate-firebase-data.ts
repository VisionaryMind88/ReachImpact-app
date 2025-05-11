import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import argon2 from 'argon2';
import * as schema from '../../shared/schema';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Configure neon to use the websocket constructor
neonConfig.webSocketConstructor = ws;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize PostgreSQL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const drizzleDb = drizzle({ client: pool, schema });

// Create backup directory
const backupDir = path.join(process.cwd(), 'backup', new Date().toISOString().replace(/:/g, '-'));
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Migration functions
async function migrateUsers(adminEmail: string, adminPassword: string) {
  console.log('Starting user migration...');
  
  try {
    // Login to Firebase as admin to get user list
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    
    // Get users from Firebase
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Backup users data
    fs.writeFileSync(
      path.join(backupDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    
    console.log(`Found ${users.length} users to migrate`);
    
    // Migrate each user
    for (const user of users) {
      try {
        // Hash password (if available, otherwise generate a random one)
        let hashedPassword = '';
        if (user.password) {
          hashedPassword = await argon2.hash(user.password);
        } else {
          // Generate a random password if none exists
          const randomPassword = Math.random().toString(36).slice(-8);
          hashedPassword = await argon2.hash(randomPassword);
          console.log(`Generated random password for user ${user.email}: ${randomPassword}`);
        }
        
        // Insert user into PostgreSQL
        await drizzleDb.insert(schema.users).values({
          email: user.email,
          password: hashedPassword,
          fullName: user.fullName || user.displayName || '',
          companyName: user.companyName || '',
          role: user.role || 'user',
          phone: user.phone || '',
          credits: user.credits || 50,
          profileImage: user.profileImage || user.photoURL || '',
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
        });
        
        console.log(`Migrated user: ${user.email}`);
      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error);
      }
      
      // Add small delay to avoid rate limiting
      await setTimeout(100);
    }
    
    console.log('User migration completed');
  } catch (error) {
    console.error('Error during user migration:', error);
  }
}

async function migrateContacts() {
  console.log('Starting contacts migration...');
  
  try {
    // Get contacts from Firebase
    const contactsSnapshot = await getDocs(collection(db, 'contacts'));
    const contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Backup contacts data
    fs.writeFileSync(
      path.join(backupDir, 'contacts.json'),
      JSON.stringify(contacts, null, 2)
    );
    
    console.log(`Found ${contacts.length} contacts to migrate`);
    
    // Get users mapping from PostgreSQL
    const users = await drizzleDb.select().from(schema.users);
    const userMap = new Map(users.map(user => [user.email, user.id]));
    
    // Migrate each contact
    for (const contact of contacts) {
      try {
        // Get user ID from PostgreSQL
        const userId = userMap.get(contact.userEmail);
        
        if (!userId) {
          console.warn(`Skipping contact ${contact.id} because user ${contact.userEmail} not found`);
          continue;
        }
        
        // Insert contact into PostgreSQL
        await drizzleDb.insert(schema.contacts).values({
          userId,
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
          jobTitle: contact.jobTitle || '',
          notes: contact.notes || '',
          tags: contact.tags || [],
          source: contact.source || 'import',
          createdAt: contact.createdAt ? new Date(contact.createdAt) : new Date(),
          updatedAt: contact.updatedAt ? new Date(contact.updatedAt) : new Date(),
        });
        
        console.log(`Migrated contact: ${contact.firstName} ${contact.lastName}`);
      } catch (error) {
        console.error(`Error migrating contact ${contact.id}:`, error);
      }
      
      // Add small delay to avoid rate limiting
      await setTimeout(50);
    }
    
    console.log('Contacts migration completed');
  } catch (error) {
    console.error('Error during contacts migration:', error);
  }
}

async function migrateCampaigns() {
  console.log('Starting campaigns migration...');
  
  try {
    // Get campaigns from Firebase
    const campaignsSnapshot = await getDocs(collection(db, 'campaigns'));
    const campaigns = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Backup campaigns data
    fs.writeFileSync(
      path.join(backupDir, 'campaigns.json'),
      JSON.stringify(campaigns, null, 2)
    );
    
    console.log(`Found ${campaigns.length} campaigns to migrate`);
    
    // Get users mapping from PostgreSQL
    const users = await drizzleDb.select().from(schema.users);
    const userMap = new Map(users.map(user => [user.email, user.id]));
    
    // Migrate each campaign
    for (const campaign of campaigns) {
      try {
        // Get user ID from PostgreSQL
        const userId = userMap.get(campaign.userEmail);
        
        if (!userId) {
          console.warn(`Skipping campaign ${campaign.id} because user ${campaign.userEmail} not found`);
          continue;
        }
        
        // Insert campaign into PostgreSQL
        await drizzleDb.insert(schema.campaigns).values({
          userId,
          name: campaign.name || '',
          description: campaign.description || '',
          status: campaign.status || 'draft',
          type: campaign.type || 'outbound',
          script: campaign.script || '',
          contactIds: campaign.contactIds || [],
          startDate: campaign.startDate ? new Date(campaign.startDate) : null,
          endDate: campaign.endDate ? new Date(campaign.endDate) : null,
          createdAt: campaign.createdAt ? new Date(campaign.createdAt) : new Date(),
          updatedAt: campaign.updatedAt ? new Date(campaign.updatedAt) : new Date(),
        });
        
        console.log(`Migrated campaign: ${campaign.name}`);
      } catch (error) {
        console.error(`Error migrating campaign ${campaign.id}:`, error);
      }
      
      // Add small delay to avoid rate limiting
      await setTimeout(50);
    }
    
    console.log('Campaigns migration completed');
  } catch (error) {
    console.error('Error during campaigns migration:', error);
  }
}

async function migrateCalls() {
  console.log('Starting calls migration...');
  
  try {
    // Get calls from Firebase
    const callsSnapshot = await getDocs(collection(db, 'calls'));
    const calls = callsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Backup calls data
    fs.writeFileSync(
      path.join(backupDir, 'calls.json'),
      JSON.stringify(calls, null, 2)
    );
    
    console.log(`Found ${calls.length} calls to migrate`);
    
    // Get users mapping from PostgreSQL
    const users = await drizzleDb.select().from(schema.users);
    const userMap = new Map(users.map(user => [user.email, user.id]));
    
    // Migrate each call
    for (const call of calls) {
      try {
        // Get user ID from PostgreSQL
        const userId = userMap.get(call.userEmail);
        
        if (!userId) {
          console.warn(`Skipping call ${call.id} because user ${call.userEmail} not found`);
          continue;
        }
        
        // Insert call into PostgreSQL
        await drizzleDb.insert(schema.calls).values({
          userId,
          contactId: call.contactId || 0,
          campaignId: call.campaignId || null,
          twilioSid: call.twilioSid || '',
          phoneNumber: call.phoneNumber || '',
          status: call.status || 'completed',
          direction: call.direction || 'outbound',
          duration: call.duration || 0,
          type: call.type || 'call',
          recordingSid: call.recordingSid || '',
          recordingUrl: call.recordingUrl || '',
          transcription: call.transcription || '',
          transcriptionSid: call.transcriptionSid || '',
          notes: call.notes || '',
          sentiment: call.sentiment || null,
          message: call.message || '',
          script: call.script || '',
          createdAt: call.createdAt ? new Date(call.createdAt) : new Date(),
          updatedAt: call.updatedAt ? new Date(call.updatedAt) : new Date(),
        });
        
        console.log(`Migrated call: ${call.id}`);
      } catch (error) {
        console.error(`Error migrating call ${call.id}:`, error);
      }
      
      // Add small delay to avoid rate limiting
      await setTimeout(50);
    }
    
    console.log('Calls migration completed');
  } catch (error) {
    console.error('Error during calls migration:', error);
  }
}

// Main migration function
async function runMigration() {
  console.log('Starting migration from Firebase to PostgreSQL...');
  
  // Check for admin credentials
  const adminEmail = process.argv[2];
  const adminPassword = process.argv[3];
  
  if (!adminEmail || !adminPassword) {
    console.error('Admin email and password are required');
    console.log('Usage: node migrate-firebase-data.js admin@email.com password');
    process.exit(1);
  }
  
  try {
    // Run migrations
    await migrateUsers(adminEmail, adminPassword);
    await migrateContacts();
    await migrateCampaigns();
    await migrateCalls();
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
    
    console.log('Database connection closed');
    process.exit(0);
  }
}

// Run the migration
runMigration();