// studio.route.js

import express from "express";
import Session from "../models/session.model.js"; // Update path as necessary
import { authenticateToken} from "../middleware/auth.js"; // Update path as necessary
import { createSession, getAllSessions, joinSession, joinSessionByRoomId, leaveSession, updateSession } from "../controllers/sessionController.js";

const router = express.Router();

// Create a New Podcast Session (Host Only)
router.post("/", authenticateToken, createSession);

// List Sessions for the Authenticated User (Host or Participant)
router.get("/", authenticateToken, getAllSessions);

// Join by roomId (more user-friendly)
router.post("/room/:roomId/join", authenticateToken, joinSessionByRoomId);

// Keep existing join by _id
router.post("/:id/join", authenticateToken, joinSession);

// Leave a Session
router.post("/:id/leave", authenticateToken, leaveSession);

// Update Session Status (Host Only)
router.patch("/:id/status", authenticateToken, updateSession);

export default router;
