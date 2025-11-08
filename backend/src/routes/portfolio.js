// src/routes/portfolio.js
import express from "express";
import { auth } from "../middleware/auth.js";
import Portfolio from "../models/Portfolio.js";

const router = express.Router();

/**
 * POST /api/portfolio
 * สร้าง portfolio ใหม่
 * ต้อง login ก่อน
 */
router.post("/", auth, async (req, res) => {
  try {
    // ดึงค่าจาก body
    const { title, desc, fileUrl, visibility } = req.body;

    // สร้างใน MongoDB
    const portfolio = await Portfolio.create({
      owner: req.user.id,
      title,
      desc,
      fileUrl: fileUrl || null,
      // 👇 อันนี้สำคัญมาก ถ้าไม่ส่งมาให้เป็น private
      visibility: visibility || "private",
      status: "submitted",
    });

    // ส่งกลับให้ client เห็น visibility ด้วย
    return res.status(201).json({
      message: "Portfolio created",
      data: portfolio,
    });
  } catch (err) {
    console.error("Create portfolio error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/portfolio/mine
 * ดู portfolio ของตัวเอง
 */
router.get("/mine", auth, async (req, res) => {
  try {
    const list = await Portfolio.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });
    return res.json(list);
  } catch (err) {
    console.error("Get my portfolio error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/portfolio/public
 * ดูเฉพาะ public
 */
router.get("/public", async (req, res) => {
  try {
    const list = await Portfolio.find({
      visibility: "public",
      status: { $ne: "rejected" },
    })
      .populate("owner", "displayName email role")
      .sort({ createdAt: -1 });

    return res.json(list);
  } catch (err) {
    console.error("Get public portfolio error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /api/portfolio/:id/visibility
 * เจ้าของเปลี่ยน public/private ได้
 */
router.put("/:id/visibility", auth, async (req, res) => {
  try {
    const { visibility } = req.body;

    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ message: "Invalid visibility value" });
    }

    const portfolio = await Portfolio.findById(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // อนุญาตเฉพาะเจ้าของ
    if (portfolio.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You cannot change this portfolio" });
    }

    portfolio.visibility = visibility;
    await portfolio.save();

    return res.json({ message: "Visibility updated", data: portfolio });
  } catch (err) {
    console.error("Update visibility error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
