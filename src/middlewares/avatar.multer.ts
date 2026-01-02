import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 300,
        height: 300,
        crop: "fill",
        gravity: "face",   
        radius: "max",     
      },
    ],
  }),
});

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB
  },
});
