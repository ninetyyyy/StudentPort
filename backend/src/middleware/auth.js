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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
}

// อนุญาตเฉพาะบาง role
export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: role not allowed" });
    }

    next();
  };
}

/* ✅ Sprint 4: authOptional — ให้คนทั่วไปเข้าหน้า public ได้
   ถ้ามี token → decode
   ถ้าไม่มี token → next() เลย */
export function authOptional(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return next(); // ยังไม่ล็อกอินก็ไปต่อได้
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET); // decode token
  } catch (err) {
    // ถ้า token ผิด → ไม่ error แต่ treat as guest
  }

  next();
}


