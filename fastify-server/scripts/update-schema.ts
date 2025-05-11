import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../../shared/schema';
import { messageTypeEnum, roomTypeEnum, messages, chatRooms, roomParticipants } from '../routes/chat-schema';
import dotenv from 'dotenv';

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

async function updateSchema() {
  try {
    console.log('Starting schema update...');
    
    // Create enums
    console.log('Creating enums...');
    
    // Create message_type enum
    try {
      await db.execute(
        `CREATE TYPE message_type AS ENUM ('text', 'image', 'file');`
      );
      console.log('Created message_type enum');
    } catch (error) {
      console.log('message_type enum already exists or error:', error.message);
    }
    
    // Create room_type enum
    try {
      await db.execute(
        `CREATE TYPE room_type AS ENUM ('direct', 'group', 'campaign');`
      );
      console.log('Created room_type enum');
    } catch (error) {
      console.log('room_type enum already exists or error:', error.message);
    }
    
    // Create messages table
    console.log('Creating messages table...');
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          sender_id INTEGER NOT NULL REFERENCES users(id),
          recipient_id INTEGER REFERENCES users(id),
          room_id INTEGER REFERENCES chat_rooms(id),
          type message_type DEFAULT 'text' NOT NULL,
          metadata JSONB DEFAULT '{}' NOT NULL,
          read BOOLEAN DEFAULT false NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log('Created messages table');
    } catch (error) {
      console.log('Error creating messages table:', error.message);
    }
    
    // Create chat_rooms table
    console.log('Creating chat_rooms table...');
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type room_type DEFAULT 'direct' NOT NULL,
          metadata JSONB DEFAULT '{}' NOT NULL,
          created_by_id INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log('Created chat_rooms table');
    } catch (error) {
      console.log('Error creating chat_rooms table:', error.message);
    }
    
    // Create room_participants table
    console.log('Creating room_participants table...');
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS room_participants (
          id SERIAL PRIMARY KEY,
          room_id INTEGER NOT NULL REFERENCES chat_rooms(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          role TEXT DEFAULT 'member' NOT NULL,
          joined_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      console.log('Created room_participants table');
    } catch (error) {
      console.log('Error creating room_participants table:', error.message);
    }
    
    console.log('Schema update completed successfully');
  } catch (error) {
    console.error('Schema update failed:', error);
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

updateSchema();