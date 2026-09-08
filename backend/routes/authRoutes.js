import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/db.js";

const router = express.Router();

// 🧩 User Registration (optional, for setup)
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username, password: hashedPassword }
    });

    res.json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔐 Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) return res.status(400).json({ message: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid username or password" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ message: "Server error", detail: error.message });
  }
});

export default router;

