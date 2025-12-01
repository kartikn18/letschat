import express from "express";
import {
    createUser,
    findUserByUsername,
    comparePassword
} from "../utils/auth.utils.js"

import {
    RegisterSchema,
    LoginSchema
} from "../utils/auth.schema.js"




const router = express.Router();

router.get("/register",(req,res)=>{
    res.render("register")
})

router.get("/login",(req,res)=>{
    res.render("login")
})

router.post("/register",async (req,res)=>{
    try {
        const { username,password} = RegisterSchema.parse(req.body);
        const extinguishuser = await findUserByUsername(username);
        if (extinguishuser) {
            return res.status(400).json({message:"This username is already taken"})
        }
        const user = await createUser(username,password);
        res.render("login",{message: "You have successfully registered" })
    } catch (error) {
        res.status(400).json({message: error instanceof Error ? error.message : "An error occurred"})   
    }
})

router.post("/login",async(req,res)=>{
    try {
        const {username,password} = LoginSchema.parse(req.body);
        const user = await findUserByUsername(username);
        if (!user) {
            return res.status(400).json({message:"Invalid username or password"})
        }
        const isPasswordValid = await comparePassword(password,user.password);
        if (!isPasswordValid) {
            return res.status(400).json({message:"Invalid username or password"})
        }
        res.render("login",{message:"You have successfully logged in"})
    } catch (error) {
        res.status(400).json({message: error instanceof Error ? error.message : "An error occurred"})
    }
})
export default router;