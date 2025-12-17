-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_name VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL NULL ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_messages_room_created_at 
ON messages(room_id, created_at DESC);
ALTER TABLE messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
-- Values: 'text', 'image', 'file', 'video', etc.
-- Track who has ever joined a room (cumulative)
CREATE TABLE IF NOT EXISTS room_members (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
  first_joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, room_id)
);

-- Track currently active sessions (who's online now)
CREATE TABLE IF NOT EXISTS room_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
  socket_id VARCHAR(100) UNIQUE NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_sessions_room_active ON room_sessions(room_id, is_active);
CREATE INDEX idx_room_sessions_socket ON room_sessions(socket_id);