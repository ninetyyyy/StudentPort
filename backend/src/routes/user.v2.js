import express from "express";
import { auth } from "../middleware/auth.js";
import multer from "multer";
import User from "../models/User.js";

const router = express.Router();
const uploadAvatar = multer({ dest: "uploads/avatar" }).single("avatar");

router.patch("/me/v2", auth, async (req, res) => {
  const { displayName } = req.body;
  const u = await User.findByIdAndUpdate(req.user.id, { displayName }, { new: true });
  res.json({ message: "updated", user: u });
});

router.post("/me/avatar/v2", auth, uploadAvatar, async (req, res) => {
  const u = await User.findByIdAndUpdate(req.user.id, { avatar: req.file.path }, { new: true });
  res.json({ message: "avatar updated", user: u });
});

export default router;
