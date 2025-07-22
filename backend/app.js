
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

const app = express();
connectDB();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(attachuser)
app.use(passport.initialize());
// Remove this line since you're using JWT, not sessions
// app.use(passport.session());

const allowedOrigins = [
    "http://localhost:5173",
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
