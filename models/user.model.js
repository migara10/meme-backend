import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "Please provide unique username"],
    unique: [true, "Username Already Exist"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    unique: false,
  },
  email: {
    type: String,
    required: [true, "Please provide unique email"],
    unique: [true, "Email Already Exist"],
  },
  otp: { type: String }, 
  otpExpiry: { type: Date }, 
  createData: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);
