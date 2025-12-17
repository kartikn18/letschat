import { Server as IOServer } from "socket.io";
import type { Socket as IOSocket } from "socket.io";
import http from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { redis } from "./config/redis.js";
import { savedMessage, getRecentMessages } from "./service/chats.service.js";
import {
  addOrUpdateRoomMember,
  createRoomSession,
  deactivateRoomSession,
  getActiveUserCount,
  getTotalMemberCount,
  getActiveUsersInRoom
} from "./service/room.service.js"

export async function initSocket(server: http.Server) {
  const io = new IOServer(server, {
    cors: { origin: '*' },
    pingTimeout: 60000,
  });

  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();

  await Promise.all([
    pubClient.connect(),
    subClient.connect()
  ]);

  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket: IOSocket) => {
    console.log('✓ Client connected:', socket.id);

    // ================= JOIN ROOM =================
    socket.on("joinRoom", async (payload: { room_id: number, user_id: number }) => {
      const { room_id, user_id } = payload;
      
      console.log('✓ joinRoom event:', { room_id, user_id, socket_id: socket.id });
      
      const roomKey = String(room_id);
      socket.join(roomKey);

      try {
        // 1. Add to room members (permanent record)
        await addOrUpdateRoomMember(user_id, room_id);
        
        // 2. Create active session (temporary record)
        await createRoomSession(user_id, room_id, socket.id);
        
        // 3. Get counts
        const activeCount = await getActiveUserCount(room_id);
        const totalCount = await getTotalMemberCount(room_id);
        const activeUsers = await getActiveUsersInRoom(room_id);
        
        console.log('📊 Room stats:', { activeCount, totalCount });
        
        // 4. Broadcast updated counts to everyone in room
        io.to(roomKey).emit("roomStatsUpdate", {
          online: activeCount,        // Currently online
          totalMembers: totalCount,   // Total members ever
          activeUsers: activeUsers.map(u => ({
            id: u.id,
            username: u.username
          }))
        });
        
        // 5. Load recent messages
        const recent = await getRecentMessages(room_id, 50);
        socket.emit("recentMessages", recent.reverse());
        
        // 6. Announce user joined
        socket.to(roomKey).emit("userJoined", {
          username: activeUsers.find(u => u.id === user_id)?.username
        });
        
      } catch (error) {
        console.error('❌ Error in joinRoom:', error);
      }
    });

    // ================= MESSAGE =================
    socket.on("message", async (payload: {
      room_id: number,
      user_id: number,
      content: string,
      message_type?: string
    }) => {
      console.log('✓ Message received:', payload);

      try {
        const messageType = payload.message_type || 'text';

        const msg = await savedMessage(
          payload.room_id,
          payload.user_id,
          payload.content,
          messageType
        );

        const roomKey = String(payload.room_id);
        io.to(roomKey).emit("newMessage", msg);

      } catch (error) {
        console.error('❌ Error saving message:', error);
      }
    });

    // ================= TYPING INDICATOR =================
    socket.on("typing", (payload: {
      room_id: number;
      user_id: number;
      username: string;
    }) => {
      const roomKey = String(payload.room_id);
      socket.to(roomKey).emit("userTyping", {
        user_id: payload.user_id,
        username: payload.username
      });
    });

    socket.on("stopTyping", (payload: {
      room_id: number;
      user_id: number;
    }) => {
      const roomKey = String(payload.room_id);
      socket.to(roomKey).emit("userStopTyping", {
        user_id: payload.user_id
      });
    });

    // ================= DISCONNECT =================
    socket.on("disconnect", async () => {
      console.log('❌ Client disconnecting:', socket.id);
      
      try {
        // Deactivate session and get room info
        const session = await deactivateRoomSession(socket.id);
        
        if (session) {
          const roomKey = String(session.room_id);
          
          // Get updated counts
          const activeCount = await getActiveUserCount(session.room_id);
          const totalCount = await getTotalMemberCount(session.room_id);
          const activeUsers = await getActiveUsersInRoom(session.room_id);
          
          console.log('📊 Updated room stats after disconnect:', { activeCount, totalCount });
          
          // Broadcast updated counts
          io.to(roomKey).emit("roomStatsUpdate", {
            online: activeCount,
            totalMembers: totalCount,
            activeUsers: activeUsers.map(u => ({
              id: u.id,
              username: u.username
            }))
          });
          
          // Announce user left
          io.to(roomKey).emit("userLeft", {
            user_id: session.user_id
          });
        }
      } catch (error) {
        console.error('❌ Error in disconnect:', error);
      }
    });

    socket.on("error", (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  return io;
}