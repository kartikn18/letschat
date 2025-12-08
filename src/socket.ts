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
    console.log(' Client connected:', socket.id);
    
    const {username, room} = socket.handshake.query as Record<string, string>;
    if(room){
        socket.join(room);
        console.log('Client joined room from handshake:', room);
    }
    
    socket.on("joinRoom", async(room_id: number) => {
      console.log('joinRoom event, room_id:', room_id, 'type:', typeof room_id);
      socket.join(String(room_id));
      
      const recent = await getRecentMessages(room_id, 50);
      console.log('Recent messages:', recent);
      socket.emit("recentMessages", recent.reverse());
    });
    
    socket.on("message", async(payload: {room_id: number, user_id: number, content: string}) => {
        console.log('Message received:', payload);
        
        const msg = await savedMessage(payload.room_id, payload.user_id, payload.content);
        console.log(' Message saved:', msg);
        
        console.log('Emitting to room:', String(payload.room_id));
        io.to(String(payload.room_id)).emit("newMessage", msg);
    });
    
    socket.on("disconnecting", () => {
      console.log('Client disconnecting:', socket.id);
    });
  });
  
  return io;
}