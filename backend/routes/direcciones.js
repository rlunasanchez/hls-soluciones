import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

// Mantenedor de Direcciones: catálogo global, independiente de Cliente
// (mismo criterio que Contactos y Equipos — sin FK). Se "llama" desde la
// OT/Cotización buscando y copiando los campos, no por referencia viva.
async function generarCodigo() {
  const [rows] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(codigo, 4) AS UNSIGNED)) AS num FROM direcciones WHERE codigo LIKE 'DI-%'"
  );
  const num = rows[0].num || 0;
  return `DI-${String(num + 1).padStart(4, "0")}`;
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `SELECT * FROM direcciones`;
    let conditions = [];
    let params = [];
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(`(LOWER(codigo) LIKE LOWER(?) OR LOWER(direccion) LIKE LOWER(?) OR LOWER(ciudad) LIKE LOWER(?) OR LOWER(comuna) LIKE LOWER(?))`);
      params.push(term, term, term, term);
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
      "SELECT * FROM direcciones WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: "Dirección no encontrada" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { direccion, ciudad, comuna } = req.body;
  try {
    if (!direccion || direccion.trim().length < 5) {
      return res.status(400).json({ msg: "Ingrese la dirección completa (mínimo 5 caracteres)" });
    }
    // Duplicado por dirección sola: si el texto de la dirección ya existe en el
    // mantenedor, se enlaza a ese registro en vez de crear otro (aunque ciudad/
    // comuna vengan vacías o distintas en esta carga puntual).
    const [dup] = await pool.query(
      `SELECT codigo FROM direcciones
      WHERE LOWER(TRIM(direccion)) = LOWER(?)
      LIMIT 1`,
      [direccion.trim()]
    );
    if (dup.length > 0) {
      return res.status(400).json({ msg: `La dirección "${direccion.trim()}" ya existe en el mantenedor con el código ${dup[0].codigo}. No se creó un nuevo registro.` });
    }
    const codigo = await generarCodigo();
    await pool.query(
      `INSERT INTO direcciones (codigo, direccion, ciudad, comuna)
      VALUES (?, ?, ?, ?)`,
      [codigo, direccion.trim(), ciudad || null, comuna || null]
    );
    res.status(201).json({ msg: "Dirección creada", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { direccion, ciudad, comuna } = req.body;
  try {
    if (!direccion || direccion.trim().length < 5) {
      return res.status(400).json({ msg: "Ingrese la dirección completa (mínimo 5 caracteres)" });
    }
    const [existing] = await pool.query("SELECT codigo FROM direcciones WHERE id = ?", [id]);
    let codigo = existing[0]?.codigo;
    if (!codigo) {
      codigo = await generarCodigo();
    }
    await pool.query(
      `UPDATE direcciones SET codigo = ?, direccion = ?, ciudad = ?, comuna = ? WHERE id = ?`,
      [codigo, direccion.trim(), ciudad || null, comuna || null, id]
    );
    res.json({ msg: "Dirección actualizada", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM direcciones WHERE id = ?", [id]);
    res.json({ msg: "Dirección eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
