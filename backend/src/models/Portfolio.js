// src/models/Portfolio.js
import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema(
  {
    // เจ้าของผลงาน
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ===== ฟิลด์ตาม requirement ใหม่ =====
    title: { type: String, required: true },            // Title
    description: { type: String, default: "" },         // Description
    yearOfProject: { type: Number, required: true },    // Year of project
    category: { type: String, required: true },         // Category (เช่น AI, Web, UX)

    // Attach files (images 1–10)
    images: { type: [String], default: [] },            // เส้นทางไฟล์รูป
    coverImageUrl: { type: String },                    // ใช้ images[0] เป็นค่าเริ่มต้นตอนสร้าง

    // ===== เวิร์กโฟลว์ Sprint 2–4 =====
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
      index: true,
    },
    statusV2: {
      type: String,
      enum: ["Draft", "Pending", "InProcess", "Approved", "Rejected"],
      default: "Draft",
      index: true,
    },
    reviewComment: { type: String },                    // เหตุผลจาก Reviewer
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    revision: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ดัชนีที่ช่วยให้ค้นหาเร็วขึ้น (อย่าประกาศก่อนสร้าง schema)
PortfolioSchema.index({ visibility: 1, statusV2: 1, yearOfProject: 1, category: 1, owner: 1 });

const Portfolio = mongoose.model("Portfolio", PortfolioSchema);
export default Portfolio;





