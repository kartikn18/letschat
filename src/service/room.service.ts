import {db} from "../config/db.js";

export async function addOrUpdateRoomMember(room_id:number,user_id:number){
    // Check if the user is already a member of the room
    const existing = await db
    .selectFrom("room_members")
    .selectAll()
    .where("room_id","=",room_id)
    .where("user_id","=",user_id)
    .executeTakeFirst();

    if (existing){
        await db
        .updateTable("room_members")
        .set({
            last_seen:new Date()
        })
        .where("user_id","=",user_id)
        .where("room_id","=",room_id)
        .execute();

        console.log(`✅ Updated last_seen for user ${user_id} in room ${room_id}`);
        return existing ;

    }

    else{
        const newMember = await db
        .insertInto("room_members")
        .values({
            room_id,
            user_id,
            joined_at:new Date(),
            last_seen:new Date(),
        } as any )
        .returningAll()
        .executeTakeFirstOrThrow();
        
        console.log(`✅ Added new member user ${user_id} to room ${room_id}:`, newMember);
        return newMember ;
    }
}

export async function getTotalCountRoomMembers(room_id:number):Promise<number>{
    const countResult = await db 
    .selectFrom("room_members")
    .select(db.fn.count('id').as('count'))
    .where("room_id","=",room_id)
    .executeTakeFirst();
    return Number(countResult?.count||0);
}

//online user 

export async function createRoomSession(room_id:number,user_id:number,socket_id:string){
    const newSession = await db
    .insertInto("room_sessions")
    .values({
        room_id,
        user_id,
        socket_id,
        joined_at:new Date(),
        is_active:true,
    } as any )
    .returningAll()
    .executeTakeFirstOrThrow();
    
    console.log(`✅ Created new room session for user ${user_id} in room ${room_id}:`, newSession);
    return newSession ; 
}

export async function deactivateRoomSession(socket_id:string){
    const result = await db
    .updateTable("room_sessions")
    .set({
        is_active:false
    }as any)
    .where("socket_id","=",socket_id).
    where("is_active","=",true)
    .returningAll()
    .executeTakeFirst();
    
    console.log(`✅ Deactivated room session for socket ${socket_id}:`, result);
    return result ;
}
export async function countActiveRoomSessions(room_id:number):Promise<number>{
    const countResult = await db
    .selectFrom("room_sessions")
    .select(db.fn.count('id').as('count'))
    .where("room_id","=",room_id)
    .where("is_active","=",true)
    .executeTakeFirst();
    return Number(countResult?.count||0);
}
export async function getActiveRoomSessionsByUser(room_id:number){
    const sessions = await db
    .selectFrom('room_sessions')
    .innerJoin('users','users.id','room_sessions.user_id')
    .where('room_sessions.room_id','=',room_id)
    .where('room_sessions.is_active','=',true)
    .select([
        'room_sessions.id',
        'room_sessions.room_id',
        'room_sessions.user_id',
        'room_sessions.socket_id',
        'room_sessions.joined_at',
        'users.username'
    ])
    .execute();
    return sessions ;
}
