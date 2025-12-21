import multer from "multer"
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from "path";

//config disk storge 
const __filename = fileURLToPath(import.meta.url);//convert to path 
const __dirname = dirname(__filename);//get dir name 

const uploadfile = path.join(__dirname,'../public/avatar');
const storage  = multer.diskStorage({
destination:function(req,file,cb)
{
    cb(null,uploadfile);
},
//filename function 
filename:(req,file,cb)=>{
    const uniqueName = 'avatar_' + Date.now() + path.extname(file.originalname);
    cb(null,uniqueName);
}

})

const fileFilter = (req:any,file:Express.Multer.File,cb:any)=>{
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const minetype = allowedTypes.test(file.mimetype);
    if(extname && minetype){
        return cb(null,true);
    }else{
        cb(new Error('Error: File type not allowed!'));
    };
}
//config multer 
export const avatarUpload = multer({
    storage:storage,
    limits:{fileSize:1*1024*1024}
,//1MB limit
fileFilter:fileFilter
});