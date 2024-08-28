import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

import crypto from "crypto";

const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999); 
  return otp.toString();
};

dotenv.config();

let refreshTokens = [];

const userNameExist = (userName) => {
  return userModel.findOne({ userName }).exec();
};

const emailExist = (email) => {
  return userModel.findOne({ email }).exec();
};

const hashPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  } catch (err) {
    throw new Error("Error hashing password");
  }
};

const registerUser = async (req, res) => {
  try {
    const { userName, password, email } = req.body;

    // Check if username already exists
    const existingUser = await userNameExist(userName);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }

    // Check if email already exists
    const existingEmail = await emailExist(email);
    if (existingEmail) {
      return res.status(409).json({ message: "Email is already in use." });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create a new user
    const newUser = new userModel({
      userName,
      password: hashedPassword,
      email,
    });

    // Save the user to the database
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const compareHashPassword = (password, hashPassword) => {
  return bcrypt.compare(password, hashPassword);
};

const generateToken = (user, key, time) => {
  return jwt.sign(
    { userId: user._id, userName: user.userName, email: user.email },
    key,
    {
      expiresIn: time,
    }
  );
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists by email
    const user = await emailExist(email);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await compareHashPassword(password, user.password);

    if (isMatch) {
      // Generate access and refresh tokens
      const accessToken = generateToken(user, process.env.ACCESS_KEY, "10m");
      const refreshToken = generateToken(user, process.env.REFRESH_KEY, "1h");

      // Store the refresh token
      refreshTokens.push(refreshToken);

      // Exclude the password from the user object before returning it
      const { password, ...userWithoutPassword } = user.toObject();

      return res.status(200).json({
        message: "User login successful.",
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      });
    } else {
      return res.status(401).json({ message: "Invalid password." });
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if refresh token is valid
    if (!refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Verify the refresh token
    jwt.verify(refreshToken, process.env.REFRESH_KEY, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Generate a new access token
      const accessToken = generateToken(user, process.env.ACCESS_KEY, "10m");
      return res.status(200).json({ accessToken });
    });
  } catch (error) {
    console.error("Error getting new token:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const logOut = (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is missing" });
    }

    // Remove the refresh token from the stored tokens
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

    return res.status(204).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error logging out:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({});

    if (!users.length) {
      return res.status(204).json({ message: "No users found" });
    }

    return res.status(200).json({ data: users });
  } catch (error) {
    console.error("Error retrieving users:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await emailExist(email);
    if (!existingUser) {
      return res.status(404).json({ message: "Please enter a valid email." });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Store OTP and its expiry time in the user document
    existingUser.otp = otp;
    existingUser.otpExpiry = otpExpiry;
    await existingUser.save();

    // Configure transporter for nodemailer
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    var mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
    };

    // Send email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Error sending OTP" });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({ message: "OTP sent successfully" });
      }
    });
  } catch (error) {
    console.error("Error during password reset:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const validateOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const existingUser = await emailExist(email);
    if (!existingUser) {
      return res.status(404).json({ message: "Invalid email address." });
    }

    // Check if OTP is correct and not expired
    if (existingUser.otp !== otp || existingUser.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    existingUser.password = hashedPassword;
    existingUser.otp = undefined;
    existingUser.otpExpiry = undefined;
    await existingUser.save();

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error validating OTP:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



export default {
  registerUser,
  loginUser,
  getToken,
  logOut,
  getAllUsers,
  resetPassword,
  validateOTP,
};
