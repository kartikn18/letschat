import multer from "multer"
import {CloudinaryStorage} from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js'

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "chat_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "pdf"],
    resource_type: "auto", 
  }),
});
export const upload = multer({
    storage,
    limits:{fileSize:10*1024*1024},
    fileFilter:(req,file,cb)=>{
        const allowed = [
     "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
        ];
        if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("File type not allowed"));
    }
});