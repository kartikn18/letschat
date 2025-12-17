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
