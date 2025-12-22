import { db } from "../config/db.js";
import path from "path";
import fs from "fs";

export async function setUserAvatarOrUpdate(
  user_id: number,
  avatar_url: string
) {
  // check existing avatar
  const existingAvatar = await db
    .selectFrom("profile_avatars")
    .select(["id", 'avatar_url'])
    .where("user_id", "=", user_id)
    .executeTakeFirst();

  // delete old file
  if (existingAvatar?.avatar_url) {
    const oldPath = path.join(process.cwd(), existingAvatar.avatar_url);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  if (existingAvatar) {
    await db
      .updateTable("profile_avatars")
      .set({
        avatar_url,
        updated_at: new Date()
      })
      .where("user_id", "=", user_id)
      .execute();
  } else {
    await db
      .insertInto("profile_avatars")
      .values({
        user_id,
        avatar_url
      } as any)
      .execute();
  }

  return avatar_url;
}
