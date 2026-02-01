# 💬 LetsChat - Real-Time Messaging Platform

A scalable, production style  real-time messaging application built with Node.js, Socket.io, and PostgreSQL. Features include room-based chat, secure authentication with OTP verification, file uploads, and containerized deployment.

[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🚀 Features

- **Real-Time Messaging**: Instant message delivery using Socket.io and WebSockets
- **Room-Based Architecture**: Create password-protected chat rooms
- **Secure Authentication**: JWT-based auth with OTP email verification via Resend
- **File Uploads**: Share images with Cloudinary CDN integration
- **Password Recovery**: Forgot password flow with OTP verification
- **Rate Limiting**: Protection against brute force and spam attacks
- **Scalable Architecture**: Redis adapter for horizontal scaling
- **Containerized Deployment**: Docker and Docker Compose ready
- **Database Optimization**: Indexed queries for performance

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Features in Detail](#features-in-detail)
- [Contributing](#contributing)
- [License](#license)

## 🛠️ Tech Stack

### Backend
- **Node.js** (v20) - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Socket.io** - Real-time bidirectional communication
- **Kysely** - Type-safe SQL query builder

### Database & Cache
- **PostgreSQL** (v16) - Primary database
- **Redis** (v7) - Caching and Socket.io adapter for horizontal scaling

### Authentication & Security
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **Resend** - Email service for OTP delivery
- **Rate Limiting** - Custom middleware for API protection

### File Storage
- **Multer** - Multipart form data handling
- **Cloudinary** - Cloud-based image storage and CDN

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

### Frontend
- **EJS** - Server-side templating
- **Vanilla JavaScript** - Client-side interactivity

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.x
- **npm** >= 9.x
- **PostgreSQL** >= 16.x
- **Redis** >= 7.x
- **Docker** & **Docker Compose** (optional, for containerized deployment)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kartikn18/letschat.git
cd letschat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables) section).

### 4. Database Setup

Run migrations to create database tables:

```bash
npm run migrate
```

### 5. Build TypeScript

```bash
npm run build
```

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=4000

# Database Configuration
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/letschat

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Resend API (for OTP emails)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Session Configuration
SESSION_SECRET=your-session-secret-key

# CORS Origin
CORS_ORIGIN=http://localhost:4000
```

### Getting API Keys

#### Resend (Email Service)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. For development, use `onboarding@resend.dev` as the from email
4. For production, verify your domain

#### Cloudinary (Image Storage)
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your cloud name, API key, and API secret from the dashboard
3. Configure upload presets if needed

## 🗄️ Database Setup

### PostgreSQL Schema

The application uses the following main tables:

- `auth_credentials` - User authentication data
- `users` - User profiles
- `rooms` - Chat rooms with passwords
- `messages` - Chat messages
- `otps` - OTP verification codes

### Running Migrations

```bash
# Run all migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Create new migration
npm run migrate:create migration_name
```

### Database Indexing

The following indexes are created for performance:

- `users.username` - For quick user lookups
- `rooms.room_name` - For room searches
- `messages.room_id` - For fetching room messages
- `messages.created_at` - For chronological ordering
- `otps.email` - For OTP verification

## 🚀 Running the Application

### Development Mode

```bash
# With auto-reload
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start server
npm start
```

The application will be available at `http://localhost:4000`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove volumes (database data)
docker-compose down -v
```

This will start:
- **App** - Node.js application (port 4000)
- **PostgreSQL** - Database (port 5432)
- **Redis** - Cache & Socket.io adapter (port 6379)

### Using Docker Only

```bash
# Build image
docker build -t letschat .

# Run container
docker run -p 4000:4000 --env-file .env letschat
```

## 🏗️ Architecture

### System Overview

```
┌─────────────┐
│   Client    │ (Browser/Mobile)
│  (Socket.io)│
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌─────────────────────────────────┐
│     Node.js + Express.js        │
│  ┌──────────┐  ┌──────────┐    │
│  │   REST   │  │ Socket.io│    │
│  │   APIs   │  │  Server  │    │
│  └──────────┘  └──────────┘    │
└────┬────────────────┬───────────┘
     │                │
     ▼                ▼
┌──────────┐    ┌──────────┐
│PostgreSQL│    │  Redis   │
│ Database │    │  Cache   │
└──────────┘    └──────────┘
     │                │
     │                └─── Socket.io Adapter (Scaling)
     │                └─── Session Storage
     └───────────────────── User Data, Messages, Rooms
```

### Key Components

**1. Authentication Service**
- JWT-based authentication
- OTP email verification (Resend)
- Password hashing (bcrypt)
- Session management (Redis)

**2. Chat Service**
- Real-time messaging (Socket.io)
- Room-based architecture
- Online user tracking
- Message broadcasting

**3. Upload Service**
- File handling (Multer)
- Cloud storage (Cloudinary)
- Image optimization

**4. Security Layer**
- Rate limiting (Redis)
- HTTP-only cookies
- CORS protection
- Input validation

### Data Flow

**Message Flow:**
```
Client A → Socket.io → Redis Pub/Sub → All Servers → Clients B,C,D
           └─────────→ PostgreSQL (persist message)
```

**Authentication Flow:**
```
1. User registers → Hash password → Store in PostgreSQL → Generate JWT
2. User logs in → Verify password → Create session (Redis) → Return JWT cookie
3. Protected route → Verify JWT → Check session → Allow/Deny access
```

### Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Docker Compose                  │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │   App    │  │PostgreSQL│  │Redis │ │
│  │Container │  │Container │  │ Con. │ │
│  │(Port 4000│  │(Port 5432│  │(6379)│ │
│  └──────────┘  └──────────┘  └──────┘ │
│                                         │
│  Volumes: pgdata, redisdata (persist)   │
└─────────────────────────────────────────┘
```

## 📁 Project Structure

```
letschat/
├── src/
│   ├── app.ts                 # Application entry point
│   ├── socket.ts              # Socket.io configuration
│   ├── config/
│   │   ├── db.ts              # Database connection
│   │   ├── redis.ts           # Redis connection
│   │   └── upload.ts          # Multer & Cloudinary config
│   ├── routes/
│   │   ├── auth.routes.ts     # Authentication endpoints
│   │   ├── web.routes.ts      # Web page routes
│   │   └── upload.routes.ts   # File upload endpoints
│   ├── middlewares/
│   │   ├── authenticationtokens.ts  # JWT verification
│   │   ├── rateLimit.ts             # General rate limiting
│   │   ├── otprequest.rl.ts         # OTP request rate limit
│   │   ├── otpverification.rl.ts    # OTP verify rate limit
│   │   └── forgetpass.rl.ts         # Forgot password rate limit
│   ├── service/
│   │   └── chats.service.ts   # Chat business logic
│   ├── utils/
│   │   └── auth.utils.ts      # Authentication utilities
│   └── views/
│       ├── index.ejs          # Landing page
│       ├── chat.ejs           # Chat interface
│       ├── login.ejs          # Login page
│       ├── register.ejs       # Registration page
│       ├── forgot-password.ejs # Password recovery
│       ├── verify-otp.ejs     # OTP verification
│       └── dashboard.ejs      # User dashboard
├── migrations/                # Database migrations
├── public/                    # Static files (CSS, JS, images)
├── uploads/                   # Local file uploads (dev only)
├── dist/                      # Compiled TypeScript
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Multi-container setup
├── package.json
├── tsconfig.json
└── .env                       # Environment variables
```

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Rate Limited |
|--------|----------|-------------|--------------|
| POST | `/register` | Register new user | ❌ |
| POST | `/login` | User login | ❌ |
| POST | `/logout` | User logout | ❌ |
| POST | `/forgetPassword` | Request password reset OTP | ✅ |
| POST | `/verifyOTP` | Verify OTP and reset password | ✅ |
| GET | `/me` | Get current user info | ❌ |

### Web Routes (`/`)

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| GET | `/` | Landing page | ❌ |
| GET | `/register` | Registration page | ❌ |
| GET | `/login` | Login page | ❌ |
| GET | `/forgot-password` | Password recovery page | ❌ |
| GET | `/verify-otp` | OTP verification page | ❌ |
| GET | `/dashboard` | User dashboard | ✅ |
| POST | `/join` | Join/create chat room | ✅ |

### Upload Routes (`/api`)

| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| POST | `/upload` | Upload image file | ✅ |

### Socket.io Events

**Client → Server:**
- `join room` - Join a chat room
- `send message` - Send text message
- `typing` - User is typing
- `stop typing` - User stopped typing

**Server → Client:**
- `user joined` - New user joined room
- `user left` - User left room
- `new message` - New message received
- `user typing` - Someone is typing
- `user stop typing` - Someone stopped typing
- `online users` - List of online users

## 🎯 Features in Detail

### 1. Real-Time Messaging

- **Socket.io** for bidirectional communication
- **Redis Adapter** for horizontal scaling across multiple servers
- Room-based message broadcasting
- Typing indicators
- Online user tracking

### 2. Secure Authentication

- **JWT tokens** stored in HTTP-only cookies
- **bcrypt** for password hashing (10 rounds)
- **OTP verification** via email using Resend API
- Session management with 24-hour expiry
- Secure cookie flags (`httpOnly`, `sameSite`, `secure`)

### 3. Rate Limiting

Multiple rate limiters to prevent abuse:

- **OTP Request**: 3 requests per 15 minutes
- **OTP Verification**: 5 attempts per 15 minutes
- **Forgot Password**: 3 requests per 15 minutes
- **General Routes**: 100 requests per 15 minutes

### 4. File Uploads

- **Multer** for handling multipart/form-data
- **Cloudinary** for cloud storage and CDN delivery
- Image optimization and compression
- Secure file type validation
- Maximum file size limits

### 5. Password Recovery

Complete forgot password flow:
1. User requests OTP via email
2. OTP sent using Resend API
3. OTP valid for 10 minutes
4. Verify OTP and set new password
5. Automatic redirect to login

### 6. Room Management

- Create password-protected rooms
- Auto-join existing rooms with correct password
- Room password verification using bcrypt
- Persistent room data in PostgreSQL

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ HTTP-only secure cookies
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ SQL injection prevention (Kysely query builder)
- ✅ XSS protection

## 📊 Performance Optimizations

- **Database Indexing**: Optimized queries on frequently accessed columns
- **Redis Caching**: Fast session and Socket.io data storage
- **Connection Pooling**: Efficient database connection management
- **CDN Integration**: Cloudinary for fast image delivery
- **Horizontal Scaling**: Redis adapter for multi-server deployment

## 🧪 Testing

```bash
# Run tests (if configured)
npm test

# Run linter
npm run lint

# Type checking
npm run type-check
```

## 📈 Monitoring & Logging

- Console logging for development
- Error tracking in production
- Socket.io connection monitoring
- Database query logging (development)

## 🚧 Roadmap

- [ ] Private direct messaging
- [ ] Message encryption (E2E)
- [ ] Voice/video calling
- [ ] Message reactions and emojis
- [ ] User profiles with avatars
- [ ] Message search functionality
- [ ] File sharing (PDFs, documents)
- [ ] Push notifications
- [ ] Admin dashboard
- [ ] Analytics and insights

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code:
- Follows the existing code style
- Includes appropriate comments
- Updates documentation as needed
- Passes all tests

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kartik Narang**

- GitHub: [@kartikn18](https://github.com/kartikn18)
- LinkedIn: [kartik-narang](https://linkedin.com/in/kartik-narang)
- Email: narangkartik5@gmail.com

## 🙏 Acknowledgments

- [Socket.io](https://socket.io/) for real-time communication
- [Resend](https://resend.com/) for email delivery
- [Cloudinary](https://cloudinary.com/) for media storage
- [PostgreSQL](https://www.postgresql.org/) for robust database
- [Redis](https://redis.io/) for caching and pub/sub

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/kartikn18/letschat/issues) page
2. Create a new issue with detailed information
3. Contact me via email or LinkedIn

---

**⭐ Star this repository if you find it helpful!**

Built with ❤️ by Kartik Narang