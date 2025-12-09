import express from "express";
import { rateLimit } from "../middlewares/rateLimit.js";
import { 
  findOrCreateUser, 
  findRoomByName, 
  createRoomWithPassword,
  compareRoomPassword  // ← Import these new functions
} from "../service/chats.service.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { user: null, error: null });  // ← Add error: null
});

router.get('/join', (req, res) => {
  res.redirect('/');
});

router.post('/join', rateLimit, async (req, res) => {
  console.log('POST /join - Body:', req.body);
  
  const { username, room, password } = req.body;
  
  // Validate all fields
  if (!username || !room || !password) {
    return res.render('index', { 
      user: null, 
      error: 'All fields are required' 
    });
  }
  
  try {
    // Find or create user
    const user = await findOrCreateUser(username);
    
    // Check if room exists
    const existingRoom = await findRoomByName(room);
    
    let roomObj;
    
    if (existingRoom) {
      // Room exists - verify password
      console.log('🔑 Room exists, checking password...');
      const passwordMatch = await compareRoomPassword(room, password);
      
      if (!passwordMatch) {
        // Wrong password!
        console.log('❌ Incorrect password');
        return res.render('index', { 
          user: null, 
          error: 'Incorrect password for this room' 
        });
      }
      
      // Password correct
      console.log('✅ Password correct');
      roomObj = existingRoom;
      
    } else {
      // Room doesn't exist - create it with this password
      console.log('➕ Creating new room with password');
      roomObj = await createRoomWithPassword(room, password);
    }
    
    console.log('✅ User joining room:', { user, room: roomObj });
    
    res.render('chat', {
      user,
      room: roomObj,
      socketUrl: `${req.protocol}://${req.get('host')}`
    });
    
  } catch (error) {
    console.error('❌ Error in /join:', error);
    res.render('index', { 
      user: null, 
      error: 'An error occurred. Please try again.' 
    });
  }
});

export default router;