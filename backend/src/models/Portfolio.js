// src/models/Portfolio.js
import mongoose from "mongoose";

const PortfolioSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    desc: { type: String },
    fileUrl: { type: String },

    // ฟิลด์กำหนดสิทธิ์การมองเห็น
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },

    status: {
      type: String,
      enum: ["submitted", "approved", "rejected"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Portfolio", PortfolioSchema);
