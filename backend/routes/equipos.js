import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const [rows] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(codigo, 4) AS UNSIGNED)) AS num FROM equipos WHERE codigo LIKE 'EQ-%'"
  );
  const num = rows[0].num || 0;
  return `EQ-${String(num + 1).padStart(4, "0")}`;
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `SELECT * FROM equipos`;
    let conditions = [];
    let params = [];
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(`(LOWER(codigo) LIKE LOWER(?) OR LOWER(serie) LIKE LOWER(?) OR LOWER(equipo) LIKE LOWER(?) OR LOWER(marca) LIKE LOWER(?) OR LOWER(modelo) LIKE LOWER(?))`);
      params.push(term, term, term, term, term);
    }
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    sql += ` ORDER BY id DESC`;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM equipos WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: "Equipo no encontrado" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { equipo, modelo, marca, serie } = req.body;
  try {
    const codigo = await generarCodigo();
    await pool.query(
      `INSERT INTO equipos (codigo, equipo, modelo, marca, serie)
      VALUES (?, ?, ?, ?, ?)`,
      [codigo, equipo, modelo, marca, serie || null]
    );
    res.status(201).json({ msg: "Equipo creado", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { equipo, modelo, marca, serie } = req.body;
  try {
    const [existing] = await pool.query("SELECT codigo FROM equipos WHERE id = ?", [id]);
    let codigo = existing[0]?.codigo;
    if (!codigo) {
      codigo = await generarCodigo();
    }
    await pool.query(
      `UPDATE equipos SET codigo = ?, equipo = ?, modelo = ?, marca = ?, serie = ? WHERE id = ?`,
      [codigo, equipo, modelo, marca, serie || null, id]
    );
    res.json({ msg: "Equipo actualizado", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM equipos WHERE id = ?", [id]);
    res.json({ msg: "Equipo eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
