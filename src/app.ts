import express from 'express';
import http from 'http';
import path from 'path';
import { initSocket } from './socket.js';
import webRoutes from './routes/web.routes.js';
import {redis} from './config/redis.js';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
//create HTTP server
const server = http.createServer(app);
//middleware 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/',webRoutes);
//initialize socket
const io = initSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT,async()=>{
    try {
        await redis.ping();
        console.log(`Server is running on http://localhost:${PORT}`);
    } catch (error) {
        console.error('Could not connect to Redis', error);
    }
});