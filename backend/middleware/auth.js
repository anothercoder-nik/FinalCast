import { verifyToken } from "../utils/helper.js";
import { findUserById } from "../DAO/user.dao.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    console.log('Token from cookies:', token); // Debug log
    
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const userId = verifyToken(token);
    console.log('User ID from token:', userId); // Debug log
    
    const user = await findUserById(userId);
    console.log('User found:', user ? 'Yes' : 'No'); // Debug log
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log('Auth middleware error:', error.message); // Debug log
    return res.status(401).json({ message: "Invalid token", error: error.message });
  }
};
