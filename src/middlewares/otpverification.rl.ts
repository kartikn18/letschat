import  type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';

export async function otpverificationLimit(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const { email } = req.body;
    
    if (!email) {
        res.status(400).json({ message: 'Email is required' });
        return;
    }
    
    const key = `otp_verify:${email}`;
    const maxAttempts = 5; 
    const windowSeconds = 15 * 60; // 15 minutes
    
    try {
        const count = await redis.incr(key);
        
        if (count === 1) {
            await redis.expire(key, windowSeconds);
        }
        
        if (count > maxAttempts) {
            const ttl = await redis.ttl(key);
            const minutesLeft = Math.ceil(ttl / 60);
            res.status(429).json({
                message: `Too many verification attempts. Please try again in ${minutesLeft} minute(s).`
            });
            return;
        }
        console.log(`✅ OTP verification allowed for ${email}. Attempt: ${count}/${maxAttempts}`);
        
        next();
    } catch (error) {
        next();
    }
}