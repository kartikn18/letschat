import express from "express";
import { rateLimit } from "../middlewares/rateLimit.js";
import { findOrCreateRoom,findOrCreateUser } from "../service/chats.service.js";
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { user: null });
});

router.get('/join', (req, res) => {
  res.redirect('/');
});

router.post('/join', rateLimit, async (req, res) => {
  
  const { username, room } = req.body;
  if (!username || !room) return res.redirect('/');
  const user = await findOrCreateUser(username);
  const roomObj = await findOrCreateRoom(room);
  res.render('chat', {
    user,
    room: roomObj,
    socketUrl: `${req.protocol}://${req.get('host')}`
  });
});

export default router;
