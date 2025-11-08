import express from "express";
import User from "../models/User.js";
import { auth, allowRoles } from "../middleware/auth.js";

const router = express.Router();

// GET /api/user → current user
router.get("/", auth, async (req, res) => {
  return res.json(req.user);
});

// GET /api/user/pending → ดึงรายชื่อคนรออนุมัติ
router.get(
  "/pending",
  auth,
  allowRoles("AdvisorAdmin", "SuperAdmin"),
  async (req, res) => {
    const users = await User.find({ status: "pending" }).select("-password");
    return res.json(users);
  }
);

// GET /api/user/:id → ดึงข้อมูลของ user รายบุคคล (ไว้ใช้ตอนกดดูรายละเอียด)
router.get(
  "/:id",
  auth,
  allowRoles("AdvisorAdmin", "SuperAdmin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// PUT /api/user/:id/approve → อนุมัติผู้ใช้
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
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ message: "✅ User approved", user });
  }
);

// DELETE /api/user/:id/reject → ลบผู้ใช้ที่ไม่ผ่านการอนุมัติ
router.delete(
  "/:id/reject",
  auth,
  allowRoles("AdvisorAdmin", "SuperAdmin"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json({ message: "❌ User rejected and deleted" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
