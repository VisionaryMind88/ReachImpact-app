import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../../shared/schema';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import argon2 from 'argon2';

// Load environment variables
dotenv.config();

// Configure neon to use the websocket constructor
neonConfig.webSocketConstructor = ws;

// Initialize PostgreSQL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

async function initDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Push all tables
    console.log('Creating all tables...');
    
    // Create users table
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          full_name TEXT NOT NULL,
          company_name TEXT,
          role TEXT DEFAULT 'user',
          phone TEXT,
          credits INTEGER DEFAULT 50,
          profile_image TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Created users table');
    } catch (error) {
      console.log('Error creating users table:', error.message);
    }
    
    // Create contacts table
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          company TEXT,
          job_title TEXT,
          notes TEXT,
          tags TEXT[],
          source TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Created contacts table');
    } catch (error) {
      console.log('Error creating contacts table:', error.message);
    }
    
    // Create campaigns table
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS campaigns (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'draft',
          type TEXT DEFAULT 'outbound',
          script TEXT,
          contact_ids INTEGER[],
          start_date TIMESTAMP,
          end_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Created campaigns table');
    } catch (error) {
      console.log('Error creating campaigns table:', error.message);
    }
    
    // Create calls table
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS calls (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          contact_id INTEGER NOT NULL,
          campaign_id INTEGER,
          twilio_sid TEXT,
          phone_number TEXT NOT NULL,
          status TEXT DEFAULT 'completed',
          direction TEXT DEFAULT 'outbound',
          duration INTEGER DEFAULT 0,
          type TEXT DEFAULT 'call',
          recording_sid TEXT,
          recording_url TEXT,
          transcription TEXT,
          transcription_sid TEXT,
          notes TEXT,
          sentiment JSONB,
          message TEXT,
          script TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Created calls table');
    } catch (error) {
      console.log('Error creating calls table:', error.message);
    }
    
    // Create admin user if specified
    const adminEmail = process.argv[2];
    const adminPassword = process.argv[3];
    
    if (adminEmail && adminPassword) {
      try {
        console.log(`Creating admin user: ${adminEmail}...`);
        
        // Check if user already exists
        const existingUser = await db.select()
          .from(schema.users)
          .where(db.eq(schema.users.email, adminEmail))
          .limit(1);
        
        if (existingUser.length > 0) {
          console.log('Admin user already exists');
        } else {
          // Hash password
          const hashedPassword = await argon2.hash(adminPassword);
          
          // Insert admin user
          await db.insert(schema.users)
            .values({
              email: adminEmail,
              password: hashedPassword,
              fullName: 'Admin User',
              companyName: 'ReachImpact',
              role: 'admin',
              credits: 1000,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          
          console.log('Admin user created successfully');
        }
      } catch (error) {
        console.error('Error creating admin user:', error);
      }
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

initDatabase();