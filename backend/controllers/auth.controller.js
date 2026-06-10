import User from "../models/User.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  try {
    await redis.set(`refreshToken:${userId}`, refreshToken, {
      EX: 7 * 24 * 60 * 60, // 7 days in seconds
    });
  } catch (error) {
    throw new Error("Error storing refresh token");
  }
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email }).select("+password");
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    } else {
      const newUser = new User({ name, email, password });
      await newUser.save();

      const { accessToken, refreshToken } = generateTokens(newUser._id);
      await storeRefreshToken(newUser._id, refreshToken);

      setCookies(res, accessToken, refreshToken);

      res.status(201).json({
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
        message: "User created successfully",
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  res.send("login route called");
};

export const logout = async (req, res) => {
  res.send("logout route called");
};
