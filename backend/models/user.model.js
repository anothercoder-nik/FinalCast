import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // Make password optional for OAuth users
  password: {
    type: String,
    select: false,
  },
  avatar: {
    type: String,
    default: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp",
  },
  // New field for users who sign up with Google
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple docs without googleId
  },
});

userSchema.methods.comparePassword = async function (password) {
  if (!this.password) return false; // No password set (OAuth user)
  return await bcrypt.compare(password, this.password);
};

userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

userSchema.pre("save", async function (next) {
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
