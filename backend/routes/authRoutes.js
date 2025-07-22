import express from "express";
import { logout_user, delete_user, login_user, register_user, google_user } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";
import passport from "passport";

const router = express.Router();

router.post("/register", register_user);
router.post("/login", login_user);
router.post("/logout",authenticateToken, logout_user);
router.post("/delete", authenticateToken, delete_user); // Protected route
router.get('/google', google_user);
  
  // Google OAuth callback
  router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication
      // Set up your JWT and session logic here if needed
      res.redirect('/');
    }
  );

export default router;
