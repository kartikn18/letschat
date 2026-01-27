import {db} from "../config/db.js";

 
export async function addOrUpdateRoomMember(user_id: number, room_id: number) {
  
  // Check if already a member
  const existing = await db
    .selectFrom('room_members')
    .selectAll()
    .where('user_id', '=', user_id)
    .where('room_id', '=', room_id)
    .executeTakeFirst();
  
  if (existing) {
    // Update last seen
    await db
      .updateTable('room_members')
      .set({ last_seen_at: new Date() })
      .where('user_id', '=', user_id)
      .where('room_id', '=', room_id)
      .execute();
    
    
    return existing;
  } else {
    // Add as new member
    const newMember = await db
      .insertInto('room_members')
      .values({
        user_id,
        room_id,
        first_joined_at: new Date(),
        last_seen_at: new Date()
      } as any)
      .returningAll()
      .executeTakeFirstOrThrow();
    
    
    return newMember;
  }
}

/**
 * Get total member count for a room (all time)
 */
export async function getTotalMemberCount(room_id: number): Promise<number> {
  const result = await db
    .selectFrom('room_members')
    .select(db.fn.count('id').as('count'))
    .where('room_id', '=', room_id)
    .executeTakeFirst();
  
  return Number(result?.count || 0);
}

// ============= SESSION TRACKING (Currently Online) =============

/**
 * Create a new active session when user joins
 */
export async function createRoomSession(
  user_id: number,
  room_id: number,
  socket_id: string
) {
  // 1. Kill any old session for same user in same room
  await db
    .updateTable('room_sessions')
    .set({ is_active: false })
    .where('user_id', '=', user_id)
    .where('room_id', '=', room_id)
    .where('is_active', '=', true)
    .execute();

  // 2. Insert new session
  const session = await db
    .insertInto('room_sessions')
    .values({
      user_id,
      room_id,
      socket_id,
      joined_at: new Date(),
      is_active: true
    } as any)
    .returningAll()
    .executeTakeFirstOrThrow();

  return session;
}


/**
 * Mark session as inactive when user disconnects
 */
export async function deactivateRoomSession(socket_id: string) {
  
  
  const session = await db
    .updateTable('room_sessions')
    .set({ is_active: false })
    .where('socket_id', '=', socket_id)
    .where('is_active', '=', true)
    .returningAll()
    .executeTakeFirst();
  
  if (session) {
    
  }
  
  return session;
}

/**
 * Get count of active users in a room (currently online)
 */
export async function getActiveUserCount(room_id: number): Promise<number> {
  const result = await db
    .selectFrom('room_sessions')
    .select(db.fn.count('id').as('count'))
    .where('room_id', '=', room_id)
    .where('is_active', '=', true)
    .executeTakeFirst();
  
  return Number(result?.count || 0);
}

/**
 * Get list of active users in a room with details
 */
export async function getActiveUsersInRoom(room_id: number) {
  const users = await db
    .selectFrom('room_sessions')
    .innerJoin('users', 'users.id', 'room_sessions.user_id')
    .select([
      'users.id',
      'users.username',
      'room_sessions.socket_id',
      'room_sessions.joined_at'
    ])
    .where('room_sessions.room_id', '=', room_id)
    .where('room_sessions.is_active', '=', true)
    .execute();
  
  return users;
}
