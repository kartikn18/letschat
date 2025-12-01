import bcrypt from "bcrypt"
import {db }from "../config/db.js"

export async function hashedPassword(password:string):Promise<string>{
    return await bcrypt.hash(password,10)
}

export async function comparePassword(password:string,hashedPassword:string):Promise<boolean>{
    return await bcrypt.compare(password,hashedPassword)
}

export async function findUserByUsername(username:string){
    return db
    .selectFrom("users")
    .selectAll()
    .where("username", "=", username)
    .executeTakeFirst()
}
export async function createUser(username:string,Password:string){
    const hashed = await hashedPassword(Password)
    const[user] = await db
    .insertInto("users")
    .values({
        username,
        password: hashed
    } as any)
    .returningAll()
    .execute()
    return user
}