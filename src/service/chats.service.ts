import {db} from "../config/db.js"
import {z} from "zod"

export const createUserSchema = z.object({ username: z.string().min(1) });
export const createRoomSchema = z.object({ name: z.string().min(1) });
export const messageSchema = z.object({
  room_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  content: z.string().min(1).max(2000)
});

export async function findOrCreateUser(username: string){
    const existing = await db.selectFrom("users").where("username", "=", username).execute();
    if(existing.length > 0){
        return existing[0];
    }
    const newUser = await db.insertInto("users").values({
        username,
        password: ''
    } as any).returningAll().executeTakeFirst();
    return newUser;
}

export async function findOrCreateRoom(name: string){
    const existing = await db.selectFrom("rooms").where("room_name", "=", name).executeTakeFirst();
    if(existing){
        return existing;
    }
    const [newRoom] = await db.insertInto("rooms").values({
        room_name: name
    } as any).returningAll().execute();
    return newRoom;
}

export async function savedMessage(room_id: number, user_id: number, content: string){
    const [msg] = await db.insertInto("messages").values({
        room_id,
        user_id,
        content
    } as any).returningAll().execute();
    
    // Fetch username to include in the message
    const user = await db.selectFrom("users")
        .where("id", "=", user_id)
        .select("username")
        .executeTakeFirst();
    
    return {
        ...msg,
        username: user?.username || 'Unknown'
    };
}

export async function getRecentMessages(room_id: number, limit: number = 50){
    return db.selectFrom("messages")
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
}