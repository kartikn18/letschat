import multer from "multer"
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
//config disk storgae 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadfile = path.join(__dirname,'../public/uploads');
const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,uploadfile);
    },
    // filename function 
filename: (req, file, cb) => {
    // Generate unique filename: uuid + original extension
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
    }
);
//check extension 
const fileFilter = (req:any,file:Express.Multer.File,cb:any)=>{
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|pdf|/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const minetype = allowedTypes.test(file.mimetype);
    if(extname && minetype){
        return cb(null,true);
    }else{
        cb(new Error('Error: File type not allowed!'));
    }
}
//config multer
export const upload = multer({
    storage:storage,
    limits:{fileSize:10*1024*1024}, //10MB limit
    fileFilter:fileFilter
});