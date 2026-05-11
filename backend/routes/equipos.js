import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const [rows] = await pool.query(
    "SELECT CAST(SUBSTRING(codigo, 4) AS UNSIGNED) AS num FROM equipos WHERE codigo LIKE 'EQ-%' ORDER BY num DESC LIMIT 1"
  );
  if (rows.length === 0) return "EQ-0001";
  return `EQ-${String(rows[0].num + 1).padStart(4, "0")}`;
}

router.get("/next-codigo", async (req, res) => {
  try {
    const codigo = await generarCodigo();
    res.json({ codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `SELECT e.*, c.razon_social as cliente_nombre, c.rut as cliente_rut, c.codigo as cliente_codigo
      FROM equipos e
      LEFT JOIN clientes c ON e.cliente_id = c.id`;
    let params = [];
    if (q && q.trim()) {
      sql += ` WHERE LOWER(e.codigo) LIKE LOWER(?) OR LOWER(e.serie) LIKE LOWER(?) OR LOWER(e.equipo) LIKE LOWER(?) OR LOWER(e.marca) LIKE LOWER(?)`;
      const term = `%${q.trim()}%`;
      params = [term, term, term, term];
    }
    sql += ` ORDER BY e.id DESC`;
    const [equipos] = await pool.query(sql, params);
    res.json(equipos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { equipo, modelo, marca, serie, contador_pag, nivel_tintas, cliente_id,
    insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
    insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia } = req.body;
  try {
    const codigo = await generarCodigo();
    await pool.query(
      `INSERT INTO equipos (codigo, cliente_id, equipo, modelo, marca, serie, contador_pag, nivel_tintas,
        insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
        insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, cliente_id || null, equipo, modelo, marca, serie || null, contador_pag || 0, nivel_tintas || null,
        insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null,
        insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null,
        insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null]
    );
    res.status(201).json({ msg: "Equipo creado", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { equipo, modelo, marca, serie, contador_pag, nivel_tintas, cliente_id,
    insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
    insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia } = req.body;
  try {
    const [existente] = await pool.query("SELECT codigo FROM equipos WHERE id = ?", [id]);
    let codigo = existente[0]?.codigo;
    if (!codigo) {
      codigo = await generarCodigo();
    }
    await pool.query(
      `UPDATE equipos SET codigo = ?, equipo = ?, modelo = ?, marca = ?, serie = ?, contador_pag = ?,
        nivel_tintas = ?, cliente_id = ?,
        insumo1 = ?, insumo2 = ?, insumo3 = ?, insumo4 = ?, insumo5 = ?, insumo6 = ?,
        insumo7 = ?, insumo8 = ?, insumo9 = ?, insumo10 = ?, insumo11 = ?, insumo12 = ?,
        averia = ? WHERE id = ?`,
      [codigo, equipo, modelo, marca, serie, contador_pag || 0, nivel_tintas, cliente_id || null,
        insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null,
        insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null,
        insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null, id]
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
