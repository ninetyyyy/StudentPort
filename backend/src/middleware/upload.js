// src/middleware/upload.js
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // ต้องมีโฟลเดอร์นี้ หรือไปตั้ง static ใน server.js
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + file.fieldname + ext);
  },
});

export const upload = multer({ storage });
