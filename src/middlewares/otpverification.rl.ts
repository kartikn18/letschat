import {redis} from '../config/redis.js';

export async function otpverificationLimit(email:string){
    const key = `otp_verification_${email}`;
    const count = await redis.incr(key);
    if(count==1){
        await redis.expire(key,15*60);//15min
    }
    if(count>3){
        throw new Error('Too many OTP verification attempts. Please try again later.');
    }
 return true;
};