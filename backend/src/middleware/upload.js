// src/middleware/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Created 'uploads' folder automatically");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // โฟลเดอร์ที่เก็บไฟล์
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + file.fieldname + ext);
  },
});

export const upload = multer({
  storage,
  limits: {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 10,                  // ✅ สูงสุด 10 ไฟล์
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PDF, JPG, PNG allowed"));
    }
    cb(null, true);
  },
});
