// src/middleware/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";

// สร้างโฟลเดอร์ uploads 
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

export const upload = multer({ storage });