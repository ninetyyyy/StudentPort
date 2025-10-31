// src/routes/user.js
import express from "express";
import User from "../models/User.js";
import { auth, allowRoles } from "../middleware/auth.js";  // ✅ แก้ตรงนี้

const router = express.Router();

// GET /api/user  → current user
router.get("/", auth, async (req, res) => {
  return res.json(req.user);
});

// GET /api/user/pending  → ให้ AdvisorAdmin / SuperAdmin ดูคนรออนุมัติ
router.get(
  "/pending",
  auth,
  allowRoles("AdvisorAdmin", "SuperAdmin"),    // ✅ แก้ตรงนี้
  async (req, res) => {
    const users = await User.find({ status: "pending" }).select("-password");
    return res.json(users);
  }
);

// PUT /api/user/:id/approve
router.put(
  "/:id/approve",
  auth,
  allowRoles("AdvisorAdmin", "SuperAdmin"),    // ✅ แก้ตรงนี้
  async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).select("-password");
    return res.json({ message: "User approved", user });
  }
);

export default router;
