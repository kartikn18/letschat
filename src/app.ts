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

dotenv.config();

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
//create HTTP server
const server = http.createServer(app);
//middleware 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/',webRoutes);
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