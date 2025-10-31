// src/server.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import portfolioRoutes from "./routes/portfolio.js";
import path from "path";
import { fileURLToPath } from "url";

// โหลดตัวแปรจาก .env
dotenv.config();

// ต่อ MongoDB
await connectDB();

const app = express();
app.use(express.json());

// ให้เสิร์ฟไฟล์ที่อัปโหลดได้ เช่น /uploads/abc.png
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// routes หลัก
app.use("/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/portfolio", portfolioRoutes);

// route ทดสอบ
app.get("/", (req, res) => {
  console.log("📥 GET / was called");
  res.send("StudentPort API is running 🚀");
});

// ใช้พอร์ตจาก .env ถ้าไม่มีให้ใช้ 3000
const PORT = process.env.PORT || 3000;

// ให้ฟังทุก interface (สำคัญเวลาใช้บน VM/Docker)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
});
