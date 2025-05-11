import { pgTable, serial, text, timestamp, integer, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from '../../shared/schema';

// Define message types
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'file']);

// Define chat room types
export const roomTypeEnum = pgEnum('room_type', ['direct', 'group', 'campaign']);

// Messages table
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  senderId: integer('sender_id').notNull().references(() => users.id),
  recipientId: integer('recipient_id').references(() => users.id),
  roomId: integer('room_id').references(() => chatRooms.id),
  type: messageTypeEnum('type').default('text').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Chat rooms table
export const chatRooms = pgTable('chat_rooms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: roomTypeEnum('type').default('direct').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdById: integer('created_by_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Room participants table
export const roomParticipants = pgTable('room_participants', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').notNull().references(() => chatRooms.id),
  userId: integer('user_id').notNull().references(() => users.id),
  role: text('role').default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Define relations
export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
  }),
  room: one(chatRooms, {
    fields: [messages.roomId],
    references: [chatRooms.id],
  }),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [chatRooms.createdById],
    references: [users.id],
  }),
  messages: many(messages),
  participants: many(roomParticipants),
}));

export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
  room: one(chatRooms, {
    fields: [roomParticipants.roomId],
    references: [chatRooms.id],
  }),
  user: one(users, {
    fields: [roomParticipants.userId],
    references: [users.id],
  }),
}));