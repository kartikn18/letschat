import {redis} from '../config/redis.js';

export async function forgetpasswordLimit(email:string){
    const key = `forget_password_${email}`;
    const count = await redis.incr(key);
    if(count==1){
        await redis.expire(key,5*60);//5min
    }
    if(count>5){
        throw new Error('Too many forget password requests. Please try again later.');
    }
 return true;
}