// app.js (your existing file with the socket handler integration)

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import "./config/passport.js";
import { attachuser } from "./utils/attachUser.js";
import studioRoutes from "./routes/studio.routes.js";
import { setupSocketHandlers } from "./socket/socketHandlers.js"; // Import your handler

const app = express();
const server = createServer(app);

connectDB();

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.method === 'POST' && !req.body && req.headers['content-length'] === '0') {
    req.body = {};
  }
  next();
});

app.use(attachuser);
app.use(passport.initialize());

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
    // Add common production patterns
    ...(process.env.FRONTEND_URL ? [
      process.env.FRONTEND_URL.replace(/\/$/, ''), // Remove trailing slash
      process.env.FRONTEND_URL.replace(/https?:\/\//, 'https://'), // Ensure HTTPS
    ] : []),
    // Allow Render.com domains if deploying there
    /https:\/\/.*\.onrender\.com$/,
    // Allow Vercel domains if deploying there
    /https:\/\/.*\.vercel\.app$/,
    // Allow Netlify domains if deploying there
    /https:\/\/.*\.netlify\.app$/
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origins
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
}));

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      // Check if origin matches any allowed origins
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      
      callback(null, isAllowed);
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Use the socket handler HERE
setupSocketHandlers(io);

// Your existing routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", studioRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server ready on port ${PORT}`);
});
