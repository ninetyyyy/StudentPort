// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      // จะ hash ตอน register
    },
    displayName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Student", "AdvisorAdmin", "SuperAdmin", "Recruiter"],
      default: "Student",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending", // ทุกคนต้องรออนุมัติ
    },
    studentCardUrl: {
      type: String, // เก็บ path รูปบัตร นศ.
    },
    employeeCardUrl: {
      type: String, // เก็บ path รูปบัตรพนักงาน (recruiter)
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
