// src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/**
 * POST /auth/register
 * ตอนนี้ปรับให้:
 * - ถ้าส่งแบบ form-data + มีไฟล์ → เก็บไฟล์
 * - ถ้าส่งแบบ JSON (ไม่มีไฟล์) → ไม่ฟ้อง error แล้ว, ใช้สำหรับเทสต์ได้
 */
router.post(
  "/register",
  // ถ้ามาเป็น form-data multer จะจัดการให้
  upload.fields([
    { name: "studentCard", maxCount: 1 },
    { name: "employeeCard", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // 1) ถ้าเป็น form-data → req.body จะมาจาก multer
      // 2) ถ้าเป็น JSON → req.body จะมาจาก express.json()
      const { email, password, displayName, role } = req.body || {};

      // กันกรณี req.body หายไปเลย
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "email and password are required" });
      }

      // กันอีเมลซ้ำ
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // ดึงไฟล์ออกมา (ถ้ามี)
      const studentCardFile = req.files?.studentCard?.[0] || null;
      const employeeCardFile = req.files?.employeeCard?.[0] || null;

      // rule สำหรับ Student
      if ((role || "Student") === "Student") {
        // ถ้าส่ง email มหาลัยไม่ถูก ให้เตือน
        if (!email.endsWith("@kmutt.ac.th")) {
          return res.status(400).json({
            message: "Student must use university email (@kmutt.ac.th)",
          });
        }

        // เดิม: บังคับต้องมีบัตร → ตอนนี้ผ่อนให้ เพื่อให้เทสต์ใน Postman ได้
        // ถ้าอยากกลับไปบังคับอีกครั้ง ให้เอา if นี้ออกจากคอมเมนต์
        // if (!studentCardFile) {
        //   return res
        //     .status(400)
        //     .json({ message: "Student card is required for student" });
        // }
      }

      // rule สำหรับ Recruiter
      if (role === "Recruiter") {
        if (!email.includes("@")) {
          return res.status(400).json({ message: "Invalid organization email" });
        }
        // เดิม: บังคับบัตรพนักงาน ตอนนี้ผ่อนให้ก่อน
        // if (!employeeCardFile) {
        //   return res
        //     .status(400)
        //     .json({ message: "Employee card is required for recruiter" });
        // }
      }

      // เข้ารหัสรหัสผ่าน
      const hashed = await bcrypt.hash(password, 10);

      const user = await User.create({
        email,
        password: hashed,
        displayName,
        role: role || "Student",
        studentCardUrl: studentCardFile ? studentCardFile.path : undefined,
        employeeCardUrl: employeeCardFile ? employeeCardFile.path : undefined,
        status: "pending", // ต้องรอ approve
      });

      return res.status(201).json({
        message: "User registered. Waiting for approval.",
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          status: user.status,
        },
      });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Email or password is incorrect" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Email or password is incorrect" });

    // ถ้ายังไม่ approve ห้ามเข้า
    if (user.status !== "approved") {
      return res
        .status(403)
        .json({ message: "Your account is not approved yet." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login success",
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /auth/google  → ไว้ต่อทีหลัง
router.get("/google", (req, res) => {
  return res.status(501).json({ message: "Google login not implemented yet" });
});

export default router;

// GET /auth/logout
router.get("/logout", (req, res) => {
  try {
    // ในระบบที่ใช้ JWT ฝั่ง server จะไม่สามารถ "ยกเลิก token" ได้โดยตรง
    // แต่เราจะให้ client ลบ token ที่เก็บไว้ (เช่น localStorage / cookie)
    return res.status(200).json({
      message: "Logout successful. Please remove your token on the client side.",
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});
