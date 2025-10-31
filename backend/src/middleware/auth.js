// src/middleware/auth.js
import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  // ต้องมี header: Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // ตอน login เรา sign แบบนี้:
    // jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, ...)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // เก็บไว้ให้ route ถัดไปใช้
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
}

// อนุญาตเฉพาะบาง role
export function allowRoles(...roles) {
  return (req, res, next) => {
    // กรณีเผื่อไว้ ถ้าไม่มี req.user
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ถ้า role ของ user ไม่อยู่ในลิสต์ที่อนุญาต
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: role not allowed" });
    }

    // ผ่าน
    next();
  };
}
