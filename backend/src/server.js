


import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import portfolioRoutes from "./routes/portfolio.js";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors"; 

dotenv.config();
await connectDB();

const app = express();
app.use(express.json());

// อนุญาตให้ frontend ติดต่อ backend ได้
// app.use(
//   // cors({
//   //   origin: "http://localhost:5000", // frontend vite port
//   //   credentials: true,
//   // })
// );

app.use(cors());

// ให้เสิร์ฟไฟล์ในโฟลเดอร์ uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.get('/test', (req, res) => {
  res.send('api already allow for contact');
});
// routes หลัก
app.use("/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/portfolio", portfolioRoutes);



// route ทดสอบ
app.get("/", (req, res) => {
  console.log("📥 GET / was called");
  res.send("StudentPort API is running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
});
