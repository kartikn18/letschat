import { db } from "../config/db.js";
import { z } from "zod";
import bcrypt from "bcrypt";
import { redis } from "../config/redis.js";
export const createUserSchema = z.object({ username: z.string().min(1) });
export const createRoomSchema = z.object({ name: z.string().min(1) });
export const messageSchema = z.object({
  room_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  content: z.string().min(1).max(2000)
});

export async function findOrCreateUser(username: string) {
  
  
  try {
    // Try to find existing user - use selectAll()
    const existing = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", username)
      .execute();
    
    
    if (existing.length > 0) {
      
      return existing[0];
    }
    
    // Create new user
   
    const newUser = await db
      .insertInto("users")
      .values({
        username,
        password: ''
      } as any)
      .returningAll()
      .executeTakeFirstOrThrow();
    
    
    return newUser;
    
  } catch (error) {
    console.error('❌ Error in findOrCreateUser:', error);
    throw error;
  }
}

export async function findOrCreateRoom(name: string) {
  
  try {
    // Try to find existing room
    const existing = await db
      .selectFrom("rooms")
      .selectAll()
      .where("room_name", "=", name)
      .executeTakeFirst();
    
    
    if (existing) {
      
      return existing;
    }
    
    // Create new room
    
    const newRoom = await db
      .insertInto("rooms")
      .values({
        room_name: name
      } as any)
      .returningAll()
      .executeTakeFirstOrThrow();
    
    
    return newRoom;
    
  } catch (error) {
    console.error('❌ Error in findOrCreateRoom:', error);
    throw error;
  }
}

export async function savedMessage(room_id: number, user_id: number, content: string,message_type:string='text',created_at:Date=new Date()) {
  
  try {
    const result = await db.transaction().execute(async(trx) => {
      const msg = await trx
        .insertInto("messages")
        .values({
          room_id,
          user_id,
        content,
        message_type,
        created_at
      } as any)
      .returningAll()
      .executeTakeFirstOrThrow();;
    // Fetch username
    const user = await db
      .selectFrom("users")
      .select("username")
      .where("id", "=", user_id)
      .executeTakeFirst();

   
    return {
      ...msg,
      username: user?.username || 'Unknown'
    };
    });
  } 
  catch (error) {
    console.error(' Error in savedMessage:', error);
    throw error;
  }
}

export async function getRecentMessages(room_id: number, limit: number = 50) {
  
  
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
    
    return messages;
    
  } catch (error) {
    console.error('❌ Error in getRecentMessages:', error);
  }
  return [];
}
export async function createRoomWithPassword(name:string,password:string){
const hashedpassword = await bcrypt.hash(password,10);
const newRoom = await db
      .insertInto("rooms")
      .values({
        room_name:name,
        password:hashedpassword}as any)
      .returningAll()
      .executeTakeFirstOrThrow();
      return newRoom;
}
export async function compareRoomPassword(roomname:string,password:string): Promise<boolean> {
  const room = await db
  .selectFrom("rooms")
  .select(["password"])
  .where("room_name","=",roomname)
  .executeTakeFirst();
if(!room){
  return false;
} 
return await bcrypt.compare(password,room.password)
}

 export async function findRoomByName(name:string){
  const newRoom = await db
      .selectFrom("rooms")
      .selectAll()
      .where("room_name","=",name)
      .executeTakeFirst();
      return newRoom;
}
//ONlineusers functions
export async function addOnlineUser(userID:number,roomID:number){
  await redis.sAdd(`online_users_room_${roomID}`,String(userID));
}
export async function removeOnlineUser(userID:number,roomID:number){
  await redis.sRem(`online_users_room_${roomID}`,String(userID));
}
export async function countOnlineUsers(roomID:number):Promise<number>{
   return await redis.sCard(`online_users_room_${roomID}`);
}
