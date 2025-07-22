import { cookieOptions } from "../config/config.js";
import { loginUser, registerUser } from "../services/auth.service.js";
import wrapAsync from "../utils/trycatchwrapper.js";
import User from "../models/user.model.js";
import passport from "passport";

export const register_user = wrapAsync( async (req, res) => {
    const {name, email, password} = req.body
    const {token,user} = await registerUser(name, email, password)
    req.user = user
    res.cookie("accessToken", token, cookieOptions)
    res.status(200).json({user:user,message:"register success"})
})

export const login_user = wrapAsync( async (req, res) => {
    const {email, password} = req.body
    const {token,user} = await loginUser(email, password)
    req.user = user
    res.cookie("accessToken", token, cookieOptions)
    res.status(200).json({user:user,message:"login success"})
})
export const logout_user = wrapAsync( async (req, res) => {
    res.clearCookie("accessToken", cookieOptions)
    res.status(200).json({message:"logout success"})
})

export const delete_user = wrapAsync(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  
  const { _id } = req.user; // Use _id instead of id
  await User.findByIdAndDelete(_id);
  res.clearCookie("accessToken", cookieOptions);
  res.status(200).json({ message: "User deleted successfully" });
});

export const google_user = wrapAsync(async (req, res, next) => {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

