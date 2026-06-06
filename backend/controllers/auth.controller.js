import User from "../models/User.model.js";

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email }).select("+password");
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    } else {
      const newUser = new User({ name, email, password });
      await newUser.save();
      res.status(201).json({ message: "User created successfully" });
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
