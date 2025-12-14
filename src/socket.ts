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

    const { username, room } = socket.handshake.query as Record<string, string>;

    if (room) {
      socket.join(room);
      console.log('Client joined room from handshake:', room);
    }

    // ================= JOIN ROOM =================
    socket.on("joinRoom", async (room_id: number) => {
      console.log('✓ joinRoom event, room_id:', room_id);
      socket.join(String(room_id));

      try {
        const recent = await getRecentMessages(room_id, 50);
        socket.emit("recentMessages", recent.reverse());
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
        socket.emit("recentMessages", []);
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

    // ================= TYPING INDICATOR (NEW) =================
    socket.on("typing", (payload: {
      room_id: number;
      user_id: number;
      username: string;
    }) => {
      socket.to(String(payload.room_id)).emit("userTyping", {
        user_id: payload.user_id,
        username: payload.username
      });
    });

    socket.on("stopTyping", (payload: {
      room_id: number;
      user_id: number;
    }) => {
      socket.to(String(payload.room_id)).emit("userStopTyping", {
        user_id: payload.user_id
      });
    });

    // ================= DISCONNECT =================
    socket.on("disconnecting", () => {
      console.log('❌ Client disconnecting:', socket.id);
    });

    socket.on("error", (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  return io;
}
