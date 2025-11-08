// src/routes/portfolio.js
import express from "express";
import { auth, allowRoles } from "../middleware/auth.js";
import Portfolio from "../models/Portfolio.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

/**
 * POST /api/portfolio
 * สร้าง portfolio ใหม่
 * ต้อง login ก่อน
 */



router.post("/", auth, upload.array("portfolioFiles", 10), async (req, res) => {
  try {
    const { title, university, year, category, desc, visibility, submit } = req.body;

// ⛔ ถ้าดังนี้ขาดอย่างใดอย่างหนึ่ง → error
  if (!title || !university || !year || !category) {
    return res.status(400).json({
      message: "title, university, year, category are required",
    });
  }
    // ✅ ต้องมีอย่างน้อย 1 ไฟล์
if (!req.files || req.files.length === 0) {
  return res.status(400).json({
    message: "At least 1 file is required (PDF, JPG, PNG ≤ 10MB)",
  });
}
// ✅ ตรวจปี
const yearNum = Number(year);
if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2025) {
  return res.status(400).json({ message: "Year must be between 2020-2025" });
}

// ✅ ตรวจ category
const allowedCategories = [
  "AI","ML","BI","QA","UX/UI","Database","Software Engineering",
  "IOT","Gaming","Web Development","Coding","Data Science",
  "Hackathon","Bigdata","Data Analytics",
];
if (!allowedCategories.includes(category)) {
  return res.status(400).json({ message: "Invalid category" });
}

// ✅ เก็บ path ไฟล์ทั้งหมดลง array
const filePaths = req.files.map((f) => f.path);


    const status = submit === "true" ? "pending" : "draft";


    const portfolio = await Portfolio.create({
      owner: req.user.id,
      title,
      university,
      year,
      category,
      desc,
      files: filePaths, // ✅ บันทึก array ไฟล์
      visibility: visibility || "private",
      status,
    });


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

// ✅ Get portfolio detail + comments
router.get("/detail/:id", auth, async (req, res) => {
  try {
    const list = await Portfolio.findById(req.params.id)
      .populate("owner", "displayName email role")
      .populate("comments.user", "displayName email role");  // ✅ ดึงชื่อผู้เมนต์

    if (!p) return res.status(404).json({ message: "Portfolio not found" });

    return res.status(200).json(list);
  } catch (err) {
    console.error("Get detail error:", err);
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
      status:  "approved" 
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

    if (portfolio.status !== "approved") {
      return res.status(400).json({
        message: "Portfolio must be approved before changing visibility",
    });
    }

    portfolio.visibility = visibility;
    await portfolio.save();

    return res.json({ message: "Visibility updated", data: portfolio });
  } catch (err) {
    console.error("Update visibility error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/portfolio/pending
 * เฉพาะ AdvisorAdmin + SuperAdmin ดูพอร์ตที่รออนุมัติ
 */
router.get(
  "/pending",
  auth,
  allowRoles("AdvisorAdmin"),
  async (req, res) => {
    try {
      const list = await Portfolio.find({ status: "pending" })
        .populate("owner", "displayName email university")
        .sort({ createdAt: -1 });

      return res.json(list);
    } catch (err) {
      console.error("Get pending portfolio error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/inProcress",
  auth,
  allowRoles("SuperAdmin"),
  async (req, res) => {
    try {
      const list = await Portfolio.find({ status: "in_process" })
        .populate("owner", "displayName email university")
        .sort({ createdAt: -1 });

      return res.json(list);
    } catch (err) {
      console.error("Get pending portfolio error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);


/**
 * PUT /api/portfolio/:id/approve
 * อนุมัติพอร์ต
 */
router.put(
  "admin/:id/approve",
  auth,
  allowRoles("AdvisorAdmin"),
  async (req, res) => {
    try {
      const p = await Portfolio.findById(req.params.id);
      if (!p) return res.status(404).json({ message: "Portfolio not found" });

      if (p.status !== "pending") {
        return res.status(400).json({
          message: "Only pending portfolios can be approved",
        });
      }

      // ✅ ถ้าใน body มี feedback → ไม่อนุญาต (feedback เฉพาะตอน reject)
      if (req.body.feedback) {
        return res.status(400).json({
          message: "Feedback is only allowed when rejecting portfolio",
        });
      }

      p.status = "in_process";
      p.reviewedBy = req.user.id;
      p.reviewedAt = new Date();
      await p.save();

      return res.json({
        message: "✅ Portfolio already sent to SuperAdmin for approval",
        data: p,
      });
    } catch (err) {
      console.error("Approve portfolio error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "super/:id/approve",
  auth,
  allowRoles("SuperAdmin"),
  async (req, res) => {
    try {
      const p = await Portfolio.findById(req.params.id);
      if (!p) return res.status(404).json({ message: "Portfolio not found" });

      if (p.status !== "in_process") {
        return res.status(400).json({
          message: "Only pending portfolios can be approved",
        });
      }

      // ✅ ถ้าใน body มี feedback → ไม่อนุญาต (feedback เฉพาะตอน reject)
      if (req.body.feedback) {
        return res.status(400).json({
          message: "Feedback is only allowed when rejecting portfolio",
        });
      }

      p.status = "approved";
      p.reviewedBy = req.user.id;
      p.reviewedAt = new Date();
      await p.save();

      return res.json({
        message: "✅ Portfolio approved",
        data: p,
      });
    } catch (err) {
      console.error("Approve portfolio error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);


/**
 * PUT /api/portfolio/:id/reject
 * ปฏิเสธพอร์ต + เหตุผล (feedback บังคับ)
 */
router.put(
  "/:id/reject",
  auth,
  allowRoles("AdvisorAdmin", "SuperAdmin"),
  async (req, res) => {
    try {
      const p = await Portfolio.findById(req.params.id);
      if (!p) return res.status(404).json({ message: "Portfolio not found" });

      if (p.status !== "pending") {
        return res.status(400).json({
          message: "Only pending portfolios can be rejected",
        });
      }

      // ✅ feedback บังคับ
      if (!req.body.feedback) {
        return res.status(400).json({
          message: "Feedback is required when rejecting portfolio",
        });
      }

      p.status = "rejected";
      p.feedback = req.body.feedback;
      p.reviewedBy = req.user.id;
      p.reviewedAt = new Date();
      await p.save();

      return res.json({
        message: "❌ Portfolio rejected",
        portfolio: {
          status: p.status,       // ✅ REJECTED
          feedback: p.feedback,   // ✅ เหตุผล
          title: p.title,
          university: p.university,
          year: p.year,
          files: p.files,       // ✅ attach ไฟล์
          desc: p.desc,           // ✅ Description
        },
      });

    } catch (err) {
      console.error("Reject portfolio error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /api/portfolio/:id
// Admin หรือ AdvisorAdmin เอาไว้เปิดพอร์ตชิ้นเดียวเต็มๆ
router.get("/:id", auth, allowRoles("AdvisorAdmin", "SuperAdmin"), async (req, res) => {
  try {
    const p = await Portfolio.findById(req.params.id)
      .populate("owner", "displayName email university role");

    if (!p) return res.status(404).json({ message: "Portfolio not found" });

    return res.json(p);
  } catch (err) {
    console.error("Get one portfolio error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


// ✅ COMMENT on portfolio
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: "Comment text required" });

    const p = await Portfolio.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Portfolio not found" });

    // ✅ push comment
    p.comments.push({
      user: req.user.id,
      role: req.user.role,    // ✅ เก็บชื่อ role ของผู้คอมเมนต์
      text,
    });

    await p.save();

    return res.json({ message: "✅ Comment added", comments: p.comments });

  } catch (err) {
    console.error("Add comment error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});



export default router;
