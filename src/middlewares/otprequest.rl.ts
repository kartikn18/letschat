import type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';

export async function otpRequestLimit(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { email } = req.body;
    
    if (!email) {
        res.status(400).json({ message: 'Email is required' });
        return;
    }
    
    const key = `otp_request:${email}`;
    const maxRequests = 3;
    const windowSeconds = 15 * 60; // 15 minutes
    
    try {
        
        const count = await redis.incr(key);
        
        
        if (count === 1) {
            await redis.expire(key, windowSeconds);
        }
        if (count > maxRequests) {
            const ttl = await redis.ttl(key);
            const minutesLeft = Math.ceil(ttl / 60);
            
            console.log(`⚠️ Rate limit exceeded for ${email}. Requests: ${count}/${maxRequests}`);
            
            res.status(429).json({
                message: `Too many OTP requests. Please try again in ${minutesLeft} minute(s).`
            });
            return;
        }
        next();
    } catch (error) {
        console.error('Rate limit error:', error);
        next();
    }
}