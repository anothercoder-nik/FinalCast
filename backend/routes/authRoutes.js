import express from "express";
import { logout_user, delete_user, login_user, register_user, google_user, get_current_user } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";
import passport from "passport";
import { signToken } from "../utils/helper.js";
import { cookieOptions } from "../config/config.js";

const router = express.Router();

router.post("/register", register_user);
router.post("/login", login_user);
router.post("/logout", authenticateToken, logout_user);
router.post("/delete", authenticateToken, delete_user);
router.get("/me", authenticateToken, get_current_user);

router.get('/google', google_user);
  

  // Google OAuth callback
  router.get(
    '/google/callback',
    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/auth` 
    }),
    async (req, res) => {
      const token = signToken({id: req.user._id});
      res.cookie("accessToken", token, cookieOptions);
      res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    }

  );

export default router;
