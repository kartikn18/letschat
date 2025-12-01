import type { Request, Response, NextFunction } from 'express';
import {redis} from "../config/redis.js"

const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE) || 120;

export async function rateLimit(req:Request,res:Response,next:NextFunction){
    try{
        const ip = String(req.ip ?? req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown');
        const currentRequests = await redis.incr(ip);
        if(currentRequests === 1){
            await redis.expire(ip, 60);
        }
        if(currentRequests > RATE_LIMIT_PER_MINUTE){
            return res.status(429).json({message:"Too many requests. Please try again later."});
        }
        next();
    }catch(error){
        console.error("Rate limiting error:",error);
        next();
    }
}