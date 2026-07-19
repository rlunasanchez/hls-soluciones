import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authMiddleware = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ msg: "No hay token, autorización denegada" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ msg: "Token expirado" });
    }
    res.status(401).json({ msg: "Token no válido" });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.rol !== "admin") {
    return res.status(403).json({ msg: "Requiere rol de administrador" });
  }
  next();
};