import userModel from "../models/user.model.js"; // import user model
import bcrypt from "bcrypt"; // import password encorder
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

let refreshTokens = [];

const userNameExist = (userName) => {
  return userModel.findOne({ userName }).exec();
};

const emailExist = (email) => {
  return userModel.findOne({ email }).exec();
};

const hashPassword = async (password) => {
  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, function (err, hash) {
      if (err) reject(err);
      resolve(hash);
    });
  });
  return hashedPassword;
};

const registerUser = async (req, res) => {
  try {
    const { userName, password, email } = req.body;

    // check username already exist
    const existingUser = await userNameExist(userName);
    if (existingUser) {
      return res.status(401).send({ message: "User is already exists." });
    }

    // check email already exist
    const existingEmail = await emailExist(email);
    if (existingEmail) {
      return res.status(401).send({ message: "Email is already use." });
    }

    const hashedPassword = await hashPassword(password); // hash password

    const newUser = new userModel({
      userName,
      password: hashedPassword,
      email
    });

    // Save the new user to the database
    await newUser.save();

    return res.status(200).send({ message: "User registered successfully." });
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const compareHashPassword = (password, hashPassword) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hashPassword, (error, passwordMatch) => {
      if (error) reject(error);
      resolve(passwordMatch);
    });
  });
};

const generateToken = (user, key, time) => {
  const token = jwt.sign({ userId: user._id }, key, {
    expiresIn: time,
  });
  return token;
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await emailExist(email);

    if (!user) {
      return res.status(400).send({ message: "Valid User Not Found." });
    }
    
    const isMatch = await compareHashPassword(password, user.password); // Compare password

    if (isMatch) {
      const accessToken = generateToken(user, process.env.ACCESS_KEY, "10m");
      const refreshToken = generateToken(user, process.env.REFRESH_KEY, "1h");

      refreshTokens.push(refreshToken);
      const userWithoutPassword = { ...user.toObject(), password };
      return res.status(200).send({
        message: "User login successfully.",
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      });
    } else {
      return res.status(400).send({ message: "Invalid Password." });
    }
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const getToken = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (refreshToken == null) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    if (!refreshTokens.includes(refreshToken)) {
      return res.status(403).send({ message: "Forbidden" }); // check refresh token already save in the server
    }
    jwt.verify(refreshToken, process.env.REFRESH_KEY, (err, user) => {
      if (err) {
        return res.status(403).send({ message: "Forbidden" });
      }
      const accessToken = generateToken(user, process.env.ACCESS_KEY, "10m");
      return res.status(200).send({ accessToken });
    });
  } catch (error) {}
};


const logOut = (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is missing" });
    }
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

    return res.status(204).json({ message: "Logout Successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await userModel.find({});

    if (result.length === 0) {
      return res.status(204).json({ message: "No users found" });
    }

    return res.status(200).json({ data: result });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export default {
  registerUser,
  loginUser,
  getToken,
  logOut,
  getAllUsers,
};