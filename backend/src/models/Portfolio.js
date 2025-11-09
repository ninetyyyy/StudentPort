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

    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },

    status: {
      type: String,
      enum: ["draft", "pending", "in_process", "approved", "rejected"],
      default: "draft",
    },

    university: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2020
    },

    category: {
      type: String,
      required: true,
      enum: [
        "AI","ML","BI","QA","UX/UI","Database","Software Engineering",
        "IOT","Gaming","Web Development","Coding","Data Science",
        "Hackathon","Bigdata","Data Analytics",
       ]
    },cover_img: {
      type: String,
    },
    files: [
      {
        type: String, // path ของ PDF / JPG / PNG
      }
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, required: true },      // ✅ เก็บ role ของคนเมนต์
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    // ✅ ✅ ✅ เพิ่มตรงนี้
    feedback: {
      type: String, // เก็บเหตุผล reject
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  


  },
  { timestamps: true }
);

export default mongoose.model("Portfolio", PortfolioSchema);
