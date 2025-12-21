import { db } from "../config/db.js";
import path from "path";
import fs from "fs";
export async function setUserAvatarOrUpdate (user_id:number,avtar_url:string){
    const avataUrl = '/public/avatar/${fileName}';
    //check if avatar exist-
    const exixtingAvatar = await db
    .selectFrom('profile_avatars')
    .select(['id','avtar_url'])
    .where('user_id',"=",user_id)
    .executeTakeFirst();
    //delete existing avatar file from server
    if(exixtingAvatar?.avtar_url){
        const oldpath = path.join(process.cwd(),exixtingAvatar.avtar_url);
        if(fs.existsSync(oldpath)){
            fs.unlinkSync(oldpath);
        }
    }
    if(exixtingAvatar){
        //update avatar record 
        const updateAvatar = await db
        .updateTable('profile_avatars')
        .set({
            avtar_url:avataUrl,
            created_at:new Date()
        })
        .where('user_id',"=",user_id)
        .executeTakeFirst();
    }
    else{
        //create new avatar record 
         await db 
        .insertInto('profile_avatars')
        .values({
            user_id:user_id,
            avtar_url:avataUrl,
            created_at:new Date(),
        } as any)
        .executeTakeFirst();
    }
return avataUrl;
}