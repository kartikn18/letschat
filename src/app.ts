import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { initSocket } from './socket.js';
import webRoutes from './routes/web.routes.js';
import {redis} from './config/redis.js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import uploadRoutes from "./routes/upload.routes.js"
import authroutes from './routes/auth.routes.js';
import { redirectIfAuthenticated } from './middlewares/authenticationtokens.js';
import cookieParser from 'cookie-parser';
import { authenticate } from './middlewares/authenticationtokens.js';
import cors from 'cors';
dotenv.config();
const app = express();
// cors middleware
const corsOptions = {
    origin: 'http://localhost:4000', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
//import socket from './socket.js';

//create HTTP server
const server = http.createServer(app);
app.use(cookieParser());'use strict';
//middleware 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//auth routes 
app.use('/api/auth', authroutes);
app.get('/register', redirectIfAuthenticated, (req, res) => {
    res.render('register', { title: 'Register - SecureChat' }); 
});
app.get('/login',redirectIfAuthenticated ,(req,res)=>{
    res.render('login', { title: 'Login - SecureChat' });
});
app.get('/forgot-password',redirectIfAuthenticated ,(req,res)=>{
    res.render('forgot-password', { title: 'Forgot Password - SecureChat' });
});
app.get('/verify-otp',redirectIfAuthenticated ,(req,res)=>{
    res.render('verify-otp', { title: 'Verify OTP - SecureChat' });
});
app.get('/dashboard', authenticate, (req:any, res:any) => {
    res.render('dashboard', { 
        title: 'Dashboard - letsChat',
        email: req.user.email
    });
});
//routes
app.use('/', authenticate, webRoutes);
app.use('/api', authenticate, uploadRoutes);

//initialize socket
const io = initSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT,async()=>{
    try {
        await redis.ping();
        console.log(`Server is running on http://localhost:${PORT}`);
    } catch (error) {
        console.error('Could not connect to Redis', error);
    }
});