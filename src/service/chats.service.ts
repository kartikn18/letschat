import { db } from "../config/db.js";
import { z } from "zod";

export const createUserSchema = z.object({ username: z.string().min(1) });
export const createRoomSchema = z.object({ name: z.string().min(1) });
export const messageSchema = z.object({
  room_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  content: z.string().min(1).max(2000)
});

export async function findOrCreateUser(username: string) {
  console.log('🔍 findOrCreateUser called with:', username);
  
  try {
    // Try to find existing user - use selectAll()
    const existing = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", username)
      .execute();
    
    console.log('📊 Existing users found:', existing.length, existing);
    
    if (existing.length > 0) {
      console.log('✅ Returning existing user:', existing[0]);
      return existing[0];
    }
    
    // Create new user
    console.log('➕ Creating new user:', username);
    const newUser = await db
      .insertInto("users")
      .values({
        username,
        password: ''
      } as any)
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('✅ New user created:', newUser);
    return newUser;
    
  } catch (error) {
    console.error('❌ Error in findOrCreateUser:', error);
    throw error;
  }
}

export async function findOrCreateRoom(name: string) {
  console.log('🔍 findOrCreateRoom called with:', name);
  
  try {
    // Try to find existing room
    const existing = await db
      .selectFrom("rooms")
      .selectAll()
      .where("room_name", "=", name)
      .executeTakeFirst();
    
    console.log('📊 Existing room:', existing);
    
    if (existing) {
      console.log('✅ Returning existing room:', existing);
      return existing;
    }
    
    // Create new room
    console.log('➕ Creating new room:', name);
    const newRoom = await db
      .insertInto("rooms")
      .values({
        room_name: name
      } as any)
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('✅ New room created:', newRoom);
    return newRoom;
    
  } catch (error) {
    console.error('❌ Error in findOrCreateRoom:', error);
    throw error;
  }
}

export async function savedMessage(room_id: number, user_id: number, content: string) {
  console.log('💾 savedMessage called:', { room_id, user_id, content });
  
  try {
    const msg = await db
      .insertInto("messages")
      .values({
        room_id,
        user_id,
        content
      } as any)
      .returningAll()
      .executeTakeFirstOrThrow();
    
    console.log('✅ Message inserted:', msg);
    
    // Fetch username
    const user = await db
      .selectFrom("users")
      .select("username")
      .where("id", "=", user_id)
      .executeTakeFirst();
    
    console.log('👤 User fetched:', user);
    
    return {
      ...msg,
      username: user?.username || 'Unknown'
    };
    
  } catch (error) {
    console.error('❌ Error in savedMessage:', error);
    throw error;
  }
}

export async function getRecentMessages(room_id: number, limit: number = 50) {
  console.log('📨 getRecentMessages called:', { room_id, limit });
  
  try {
    const messages = await db
      .selectFrom("messages")
      .innerJoin("users", "users.id", "messages.user_id")
      .where("messages.room_id", "=", room_id)
      .select([
        "messages.id",
        "messages.room_id",
        "messages.user_id",
        "messages.content",
        "messages.created_at",
        "users.username"
      ])
      .orderBy("messages.created_at", "desc")
      .limit(limit)
      .execute();
    
    console.log('✅ Messages fetched:', messages.length);
    return messages;
    
  } catch (error) {
    console.error('❌ Error in getRecentMessages:', error);
    return [];
  }
}