import {db} from "../config/db.js";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';
dotenv.config();
export async function hashPassword(password:string): Promise<string> {
 return await bcrypt.hash(password,10);
}
export async function checkUserExists(email:string){
    const existingUser = await db.
    selectFrom('users')
    .select(['id','email','password'])
    .where('email','=',email)
    .executeTakeFirstOrThrow();
    return existingUser;
}
export async function CreateUser(email:string,password:string){
    const existingUser = await checkUserExists(email)
    if (existingUser){
      throw Error('User already exists');
    }
    const newUser = await db
    .insertInto('users')
    .values({
        email:email,
        password: await hashPassword(password),
        created_at:new Date()
    } as any)
    .returning(['id','email'])
    .executeTakeFirst();
    return generatejwt(newUser?.email as any);
}
const otpGenerate = ()=>{
    return Math.floor(100000 + Math.random() * 900000).toString();
};
 // otp system 
 export async function generateandSaveOTP(email:string){
    const otp = otpGenerate();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db
    .insertInto('email_otps')
    .values({
        otp:otp,
        email:email,
        expires_at:expiresAt,
        created_at:new Date()
    }as any)
.executeTakeFirst();
return otp;
 }
 export async function verifyOTP(email:string,otp:string){
    const record = await db
    .selectFrom('email_otps')
    .selectAll()
    .where('email','=',email)
    .where('otp','=',otp)
    .executeTakeFirst();
    if (!record){
        throw new Error('Invalid OTP');
    }
    if (record.expires_at < new Date()){
        throw new Error('OTP has expired');
    }
    return true;
 }
 //email service 
const resend = new Resend(process.env.RESEND_API_KEY!);
export async function sendOTPEmail(email:string,otp:string){
    const {data} = await resend.emails.send({
    from: "Chat App <noreply@yourapp.com>",
    to: email,
    subject: "Your OTP Code",
    html: `<h2>Your OTP is ${otp}</h2><p>Valid for 5 minutes</p>`,
    })
}
export async function LoginUser(email:string,password:string){
    const user = await checkUserExists(email)
    if(!user){
        throw new Error('user does not exist');
    }
    const match = await bcrypt.compare(password, user.password);
    if(!match){
        throw new Error('Incorrect password');
    }
    return generatejwt(user.email);
}

export function generatejwt(email:string){
    const token = jwt.sign({email:email}, process.env.JWT_SECRET!);
    return token;
}