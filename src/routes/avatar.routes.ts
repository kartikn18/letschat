import { setUserAvatarOrUpdate } from '../service/avatar.service.js'
import { avatarUpload } from '../middlewares/avatar.multer.js'
import { Router } from "express";
import { email } from 'zod';

export const router = Router();

// Route to upload or update user avatar
router.post(
  "/avatar",
  avatarUpload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      const email = req.body.email; // check sql for this update the sql query and use the avatar to emial only 
      const avatarUrl = `/public/avatar/${req.file.filename}`;

      await setUserAvatarOrUpdate(email, avatarUrl);

      res.json({
        success: true,
        avatar_url: avatarUrl
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "An error occurred"
      });
    }
  }
);
