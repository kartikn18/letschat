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
    const newUser = await db.insertInto("users").values({username} as any).returningAll().executeTakeFirst();
    return newUser;
}

export async function findOrCreateRoom(name:string){
    const existing = await db.selectFrom("rooms").where("name", "=", name).executeTakeFirst();
    if(existing){
        return existing;
    }
    const [newRoom] = await db.insertInto("rooms").values({name} as any).returningAll().execute();
    return newRoom;
}

export async function savedMessage(room_id:number,user_id:number,content:string){
    const [msg] = await db.insertInto("messages").values({
        room_id,
        user_id,
        message:content,
        created :new Date()
    } as any).returningAll().execute();
    return msg;
}

export async function getRecentMessages(room_id:number,limit:number=50){
    return db.selectFrom("messages")
    .where("room_id","=",room_id)
    .orderBy("createdAt","desc")
    .limit(limit)
    .execute();
}
