import { createClient } from "redis"
import dotenv from "dotenv"
dotenv.config();

export const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});
redis.on("connect",()=>{
  console.log("Redis client connected");
})
redis.on("error",(err)=>{
  console.log("Redis Client Error",err);
})

redis.connect().catch((err)=>{
  console.error("Could not connect to Redis",err);
});