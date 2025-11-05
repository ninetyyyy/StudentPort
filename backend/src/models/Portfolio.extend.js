import Portfolio from "./Portfolio.js";
import mongoose from "mongoose";

// ✅ เพิ่มฟิลด์ใหม่ Sprint 2
const ExtraPortfolioSchema = new mongoose.Schema({
  images: [{ type: String }],
  tags: [{ type: String }],
  workDate: { type: Date },
  award: { type: String },
  awardYear: { type: Number },
  coverImageUrl: { type: String },

  statusV2: {
    type: String,
    enum: ["Draft", "Pending", "InProcess", "Approved", "Rejected"],
    default: "Draft"
  },

  revision: { type: Number, default: 0 }
});

// ✅ Extend schema ไม่แตะไฟล์เก่า
Portfolio.schema.add(ExtraPortfolioSchema);

export default Portfolio;
