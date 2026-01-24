import {upload} from "../config/upload.js";
import express from "express";
import {db} from "../config/db.js";
const router = express.Router();

// single file upload 
router.post("/upload",upload.single('file'), async(req,res)=>{
    try {
        if(req.file) {
    console.log('fileinfo',req.file);
    const {room_id,user_id} = req.body;
    // file url 
    const fileurl = req.file.path;
    //insert file into db
     const message = await db.insertInto('messages').values({
        room_id:Number(room_id),
        user_id :Number(user_id),
        content:fileurl,
        message_type:'file'
    }as any).returningAll().executeTakeFirst();
    res.json({
      success: true,
      fileUrl: fileurl,
      message: message
    });
}
} catch (error) {
        console.error('❌ Error in /upload route:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
})
export default router ;
