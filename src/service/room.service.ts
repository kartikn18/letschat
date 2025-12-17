import {db} from "../config/db.js";

 
export async function addOrUpdateRoomMember(user_id: number, room_id: number) {
  console.log('📝 Adding/updating room member:', { user_id, room_id });
  
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
    
    console.log('✅ Updated existing member');
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
    
    console.log('✅ Added new member');
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
  console.log('🔌 Creating room session:', { user_id, room_id, socket_id });
  
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
  
  console.log('✅ Session created:', session.id);
  return session;
}

/**
 * Mark session as inactive when user disconnects
 */
export async function deactivateRoomSession(socket_id: string) {
  console.log('🔌 Deactivating session for socket:', socket_id);
  
  const session = await db
    .updateTable('room_sessions')
    .set({ is_active: false })
    .where('socket_id', '=', socket_id)
    .where('is_active', '=', true)
    .returningAll()
    .executeTakeFirst();
  
  if (session) {
    console.log('✅ Session deactivated for room:', session.room_id);
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
