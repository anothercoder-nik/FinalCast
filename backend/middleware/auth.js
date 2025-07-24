// auth.js

import { verifyToken } from "../utils/helper.js";
import { findUserById } from "../DAO/user.dao.js";

export const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from cookies (assumes cookie-parser middleware is used)
    const token = req.cookies?.accessToken;
    console.log("Token from cookies:", token); // Debug log

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Verify JWT token and extract payload (e.g., user ID)
    const userId = verifyToken(token); 
    console.log("User ID from token:", userId); // Debug log

    // Fetch the user from DB by ID, excluding sensitive info
    const user = await findUserById(userId);
    console.log("User found:", user ? "Yes" : "No"); // Debug log

    // If no user is found (user deleted or invalid token), reject
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request object for downstream middleware/controllers
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message); // Debug log
    return res.status(401).json({ message: "Invalid token", error: error.message });
  }
};
