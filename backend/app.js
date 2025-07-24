
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import "./config/passport.js";
import { attachuser } from "./utils/attachUser.js";
import studioRoutes from "./routes/studio.routes.js";

const app = express();
connectDB();

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add this middleware to handle empty bodies
app.use((req, res, next) => {
  if (req.method === 'POST' && !req.body && req.headers['content-length'] === '0') {
    req.body = {};
  }
  next();
});

app.use(attachuser)
app.use(passport.initialize());
// Remove this line since you're using JWT, not sessions
// app.use(passport.session());

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000"
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

app.use("/api/auth", authRoutes);
app.use("/api/sessions", studioRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
