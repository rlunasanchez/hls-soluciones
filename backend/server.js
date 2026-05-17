import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import equiposRoutes from "./routes/equipos.js";
import clientesRoutes from "./routes/clientes.js";
import ordenesRoutes from "./routes/ordenes.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { msg: "Demasiadas solicitudes, intenta más tarde" }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { msg: "Demasiados intentos de login, intenta en 15 minutos" }
});

app.use(limiter);
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/equipos", equiposRoutes);
app.use("/api/clientes", clientesRoutes);
app.use("/api/ordenes", ordenesRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});