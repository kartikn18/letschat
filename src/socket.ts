import { Server as IOServer } from "socket.io";
import type { Socket as IOSocket } from "socket.io";
import http from "http";
import { createAdapter } from "@socket.io/redis-adapter";
import { redis } from "./config/redis.js";
import { savedMessage, getRecentMessages } from "./service/chats.service.js";

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
    
    const {username, room} = socket.handshake.query as Record<string, string>;
    if(room){
        socket.join(room);
        console.log('Client joined room from handshake:', room);
    }
    
    socket.on("joinRoom", async(room_id: number) => {
      console.log('✓ joinRoom event, room_id:', room_id, 'type:', typeof room_id);
      socket.join(String(room_id));
      
      try {
        const recent = await getRecentMessages(room_id, 50);
        console.log('✓ Recent messages:', recent.length);
        socket.emit("recentMessages", recent.reverse());
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
        socket.emit("recentMessages", []);
      }
    });
    
    socket.on("message", async(payload: {
      room_id: number, 
      user_id: number, 
      content: string,
      message_type?: string  // ← Make it optional with ?
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
          console.log('✓ Message saved:', msg);
          
          const roomKey = String(payload.room_id);
          console.log('📤 Emitting to room:', roomKey);
          io.to(roomKey).emit("newMessage", msg);
        } catch (error) {
          console.error('❌ Error saving message:', error);
        }
    });
    
    socket.on("disconnecting", () => {
      console.log('❌ Client disconnecting:', socket.id);
    });
    
    socket.on("error", (error) => {
      console.error('❌ Socket error:', error);
    });
  });
  
  return io;
}