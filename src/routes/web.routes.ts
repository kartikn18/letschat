import express from "express";
import { rateLimit } from "../middlewares/rateLimit.js";
import { findOrCreateRoom, findOrCreateUser } from "../service/chats.service.js";

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { user: null });
});

router.get('/join', (req, res) => {
  res.redirect('/');
});

router.post('/join', rateLimit, async (req, res) => {
  console.log('POST /join - Body:', req.body);
  
  const { username, room } = req.body;
  if (!username || !room) {
    console.log('Missing username or room');
    return res.redirect('/');
  }
  
  try {
    const user = await findOrCreateUser(username);
    const roomObj = await findOrCreateRoom(room);
    
    console.log('=== DATABASE RESULTS ===');
    console.log('User:', JSON.stringify(user, null, 2));
    console.log('User keys:', user ? Object.keys(user) : 'null');
    console.log('Room:', JSON.stringify(roomObj, null, 2));
    console.log('Room keys:', roomObj ? Object.keys(roomObj) : 'null');
    console.log('========================');
    
    if (!user) {
      console.error('❌ User is null!');
      return res.redirect('/');
    }
    
    if (!roomObj) {
      console.error('❌ Room is null!');
      return res.redirect('/');
    }
    
    res.render('chat', {
      user,
      room: roomObj,
      socketUrl: `${req.protocol}://${req.get('host')}`
    });
  } catch (error) {
    console.error('Error in /join:', error);
    res.redirect('/');
  }
});

export default router;