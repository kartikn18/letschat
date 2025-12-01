import { Server as IOServer } from "socket.io"
import http from "http"
import {createAdapter} from "@socket.io/redis-adapter"
import {redis} from "../src/config/redis.js"
import { savedMessage,getRecentMessages } from "./service/chats.service.js";
import type { Database } from "./db/schema.js";
import { db } from "./config/db.js";
import type { Socket as IOSocket } from "socket.io";

export function initSocket(server: http.Server) {
  const io = new IOServer(server, {
    cors: { origin: '*' },
    pingTimeout: 60000,
  });
  
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();  
  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket: IOSocket) => {
    const {username,room} = socket.handshake.query as Record <string,string>;
    if(room){
        socket.join(room)
    }

    socket.on("joinRoom", async(room_id:number)=>{
      socket.join(String(room_id));
      const recent = await getRecentMessages(room_id,50);
      // emit recent messages back to the caller (adjust event name/behavior as needed)
      socket.emit("recentMessages", recent.reverse());
    })
    socket.on("message", async(payload:{room_id:number,user_id:number,content:string})=>{
        const msg = await savedMessage(payload.room_id,payload.user_id,payload.content);
        //room concept
        io.to(String(payload.room_id)).emit("newMessage",msg);
    })
    socket.on("disconnecting", () => {
      console.log('Client is disconnecting');
    });
  });
}