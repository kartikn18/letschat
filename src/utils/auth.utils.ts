import {db} from "../config/db.js";
import bcrypt from "bcrypt";

export async function hashPassword(password:string): Promise<string> {
 return await bcrypt.hash(password,10);
}
export async function checkUserExists(email:string){
    const existingUser = await db.
    selectFrom('users')
    .select(['id','email'])
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
    return newUser;
};

const otpGenerate = ()=>{
    return Math.floor(100000 + Math.random() * 900000).toString();
};
 