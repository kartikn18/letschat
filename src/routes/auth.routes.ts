import { Router } from 'express';
import { checkUserExists, CreateUser , LoginUser,generateandSaveOTP,sendOTPEmail,verifyOTP,hashPassword} from '../utils/auth.utils.js';
import { db } from '../config/db.js';
import { otpRequestLimit } from '../middlewares/otprequest.rl.js';
import { forgetpasswordLimit } from '../middlewares/forgetpass.rl.js';
import { otpverificationLimit } from '../middlewares/otpverification.rl.js';
const router = Router();

//register route 
router.post('/register', async (req,res)=>{
    try {
        const {email,password} = req.body;
        //check if user exists 
        const existingUser = await checkUserExists(email);
        if (existingUser) {
            return res.status(400).json({message: 'user already registered'});
        }
        //create user 
        const token = await CreateUser(email,password);
        res.cookie('cookie',token,{httpOnly:true,sameSite:'strict'});
         return res.status(201).json({token});
        //send response
    } catch (error) {
        return res.status(500).json({message: 'Internal server error'});
    }
});
router.post('/login',async(req,res)=>{
    try {
        const {email,password} = req.body;
        const existingUser = await checkUserExists(email);
        if (!existingUser){
            return res.status(400).json({message:'Invalid credentials'});
        }
        const token = await LoginUser(email,password);
        res.cookie('cookie',token,{httpOnly:true,sameSite:'strict'});
        return res.status(200).json({token});
    } catch (error) {
        return res.status(500).json({message: 'Internal server error'});
    }

});   
router.post('/forgetPassword',async(req,res)=>{
    const {email} = req.body;
    try {
        const user = await checkUserExists(email);
        if(!user){
            return res.status(400).json({message:'User not found'});
        }
        //genearate and save otp 
        const otp = await generateandSaveOTP(email);
        //send otp via email service (mocked here)
        await otpRequestLimit(email);
        sendOTPEmail(email,otp);
        return res.status(200).json({message:'OTP sent to email'});

    } catch (error) {
        return res.status(500).json({message:'Internal server error'});
    }
});
router.post('/verifyOTP',async(req,res)=>{
    const {email,otp,newPassword} = req.body;
    try {
      await otpverificationLimit(email);
      const userotp =  await verifyOTP(email,otp);
      if(!userotp){
        return res.status(400).json({message:'Invalid OTP'});
      }
      //update password
      await forgetpasswordLimit(email);
      const hashed =  await hashPassword(newPassword);
      //update in db
      await db
      .updateTable('users')
      .set({password:hashed} as any)
      .where('email','=',email)
      .execute();
      return res.status(200).json({message:'Password updated successfully'});

    } catch (error) {
        return res.status(500).json({message:'Internal server error'});
    }
});
router.post('/logout',(req,res)=>{
    res.clearCookie('cookie',{httpOnly:true,sameSite:'strict'});
    return res.status(200).json({message:'Logged out successfully'});
});
export default router;