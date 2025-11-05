// src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/* ------------------- REGISTER ------------------- */
router.post(
  "/register",
  upload.fields([
    { name: "studentCard", maxCount: 1 },
    { name: "employeeCard", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { email, password, displayName, role } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ message: "email and password required" });
      }

      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: "Email already exists" });

      if ((role || "Student") === "Student" && !email.endsWith("@kmutt.ac.th")) {
        return res.status(400).json({ message: "Student must use @kmutt.ac.th" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const user = await User.create({
        email,
        password: hashed,
        displayName,
        role: role || "Student",
        studentCardUrl: req.files?.studentCard?.[0]?.path,
        employeeCardUrl: req.files?.employeeCard?.[0]?.path,
        status: "pending",
      });

      return res.status(201).json({
        message: "User registered. Waiting for approval.",
        user: { _id: user._id, email, displayName, role: user.role },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

/* ------------------- LOGIN ------------------- */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Email or password incorrect" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Email or password incorrect" });

    if (user.status !== "approved") {
      return res.status(403).json({ message: "Account not approved yet" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login success",
      token,
      user: { _id: user._id, email, displayName: user.displayName, role: user.role },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ------------------- LOGOUT ------------------- */
router.get("/logout", (req, res) => {
  return res.json({ message: "Logout successful — clear token on client." });
});

/* ------------------- FORGOT PASSWORD ------------------- */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    return res.json({
      message: "Reset token created. (Use in /auth/reset-password)",
      token: resetToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------- RESET PASSWORD ------------------- */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Password reset complete ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
