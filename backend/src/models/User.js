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
      default: "pending",
    },

    studentCardUrl: String,
    employeeCardUrl: String,

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    /* ✅ NEW fields for profile */
    bio: String,
    contactEmail: String,
    phone: String,
    profileImageUrl: String,
    socialLinks: {
      linkedin: String,
      github: String,
      facebook: String,
      website: String,
    },

    /* ✅ NEW fields for reset password */
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
