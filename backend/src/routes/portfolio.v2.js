// src/routes/portfolio.v2.js
import express from "express";
import { auth } from "../middleware/auth.js";
import Portfolio from "../models/Portfolio.js";
import { uploadPortfolioV2 } from "../middleware/upload.v2.js";

const router = express.Router();

/**
 * POST /api/portfolio/v2
 * Create Draft (Sprint 2) ด้วยฟิลด์ใหม่:
 * - title (required)
 * - yearOfProject (required, number)
 * - category (required, string)
 * - description (optional)
 * - images (required, at least 1, max 10) -> form-data
 */
router.post("/v2", auth, uploadPortfolioV2, async (req, res) => {
  try {
    const { title, description, yearOfProject, category } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!yearOfProject) return res.status(400).json({ message: "Year of project is required" });
    if (!category) return res.status(400).json({ message: "Category is required" });

    // แปลงปีเป็น Number (กัน front ส่ง string มา)
    const yearNum = Number(yearOfProject);
    if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 3000) {
      return res.status(400).json({ message: "Year of project must be a valid year" });
    }

    // ตรวจรูปอย่างน้อย 1 รูป และไม่เกิน 10
    const imgFiles = req.files?.images || [];
    if (imgFiles.length < 1) {
      return res.status(400).json({ message: "At least one image is required" });
    }
    if (imgFiles.length > 10) {
      return res.status(400).json({ message: "Maximum 10 images allowed" });
    }

    const images = imgFiles.map((f) =>
      // เก็บ path แบบ relative จากโฟลเดอร์ src เพื่อเสิร์ฟผ่าน /uploads ได้
      `uploads/portfolio_v2/${f.filename}`
    );

    const portfolio = await Portfolio.create({
      owner: req.user.id,
      title,
      description: description || "",
      yearOfProject: yearNum,
      category,
      images,
      coverImageUrl: images[0],
      statusV2: "Draft",
      visibility: "private",
    });

    return res.status(201).json({ message: "Draft saved", data: portfolio });
  } catch (err) {
    console.error("Create draft v2 error:", err);
    // จับ error จาก multer ด้วย
    if (err instanceof Error && /Only image files/i.test(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Each image must be ≤ 10MB" });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/portfolio/:id/v2/submit
 * ส่งงานจาก Draft/Rejected → Pending (ไม่มี body)
 * เงื่อนไข:
 *  - เจ้าของงานเท่านั้น
 *  - ต้องมีรูป ≥ 1
 */
router.post("/:id/v2/submit", auth, async (req, res) => {
  try {
    const p = await Portfolio.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Portfolio not found" });

    if (p.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not your portfolio" });
    }

    if (!["Draft", "Rejected"].includes(p.statusV2)) {
      return res.status(400).json({ message: "Only Draft/Rejected can be submitted" });
    }

    if (!Array.isArray(p.images) || p.images.length < 1) {
      return res.status(400).json({ message: "At least one image is required before submit" });
    }

    if (p.statusV2 === "Rejected") p.revision = (p.revision ?? 0) + 1;

    p.statusV2 = "Pending";
    p.reviewComment = ""; // ล้างคอมเมนต์เก่าก่อนส่งใหม่
    await p.save();

    return res.json({ message: "Submitted for review", data: p });
  } catch (err) {
    console.error("Submit v2 error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;


