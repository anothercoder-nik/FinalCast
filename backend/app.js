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
    process.env.FRONTEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
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
