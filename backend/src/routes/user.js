// src/routes/user.js
import express from "express";
import User from "../models/User.js";
import { auth, allowRoles } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/** ====== เดิม (ห้ามลบ) ====== */

// GET /api/user → เอาเฉพาะข้อมูลจาก token (id, role)
router.get("/", auth, async (req, res) => {
  return res.json(req.user);
});

// GET /api/user/pending
router.get(
  "/pending",
  auth,
  allowRoles("AdvisorAdmin", "SuperAdmin"),
  async (req, res) => {
    const users = await User.find({ status: "pending" }).select("-password");
    return res.json(users);
  }
);

// PUT /api/user/:id/approve
router.put(
  "/:id/approve",
  auth,
  allowRoles("AdvisorAdmin", "SuperAdmin"),
  async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).select("-password");
    return res.json({ message: "User approved", user });
  }
);

/** ====== ✅ เพิ่มใหม่: Profile Management ====== */

// GET /api/user/me → ดึงโปรไฟล์เต็มของตัวเอง
router.get("/me", auth, async (req, res) => {
  const me = await User.findById(req.user.id).select(
    "-password -resetPasswordToken -resetPasswordExpires"
  );
  return res.json(me);
});

/**
 * PUT /api/user/profile
 * นักศึกษาแก้ไขโปรไฟล์ตัวเอง + อัปโหลดรูป
 * Body: form-data
 *  displayName, bio, contactEmail, phone, linkedin, github, facebook, website
 *  profileImage (File)
 */
router.put("/profile", auth, upload.single("profileImage"), async (req, res) => {
  try {
    const {
      displayName,
      bio,
      contactEmail,
      phone,
      linkedin,
      github,
      facebook,
      website,
    } = req.body;

    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "User not found" });

    if (displayName !== undefined) u.displayName = displayName;
    if (bio !== undefined) u.bio = bio;
    if (contactEmail !== undefined) u.contactEmail = contactEmail;
    if (phone !== undefined) u.phone = phone;

    // อัปเดต social links เฉพาะค่าที่ส่งมา
    u.socialLinks = {
      linkedin: linkedin ?? u.socialLinks?.linkedin,
      github: github ?? u.socialLinks?.github,
      facebook: facebook ?? u.socialLinks?.facebook,
      website: website ?? u.socialLinks?.website,
    };

    if (req.file?.path) {
      u.profileImageUrl = req.file.path;
    }

    await u.save();

    const safe = u.toObject();
    delete safe.password;
    delete safe.resetPasswordToken;
    delete safe.resetPasswordExpires;

    return res.json({ message: "Profile updated", user: safe });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
