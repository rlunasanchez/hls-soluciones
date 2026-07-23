import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const result = await pool.query("SELECT MAX(CAST(SUBSTRING(codigo, 4) AS INTEGER)) AS num FROM equipos WHERE codigo LIKE 'EQ-%'");
  const num = result.rows[0]?.num || 0;
  return `EQ-${String(num + 1).padStart(4, "0")}`;
}

router.get("/next-codigo", authMiddleware, async (req, res) => {
  try {
    const codigo = await generarCodigo();
    res.json({ codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `SELECT e.*, c.razon_social as cliente_nombre, c.rut as cliente_rut, c.codigo as cliente_codigo
      FROM equipos e
      LEFT JOIN clientes c ON e.cliente_id = c.id`;
    let params = [];
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      sql += ` WHERE (LOWER(e.codigo) LIKE LOWER($1) OR LOWER(e.serie) LIKE LOWER($2) OR LOWER(e.equipo) LIKE LOWER($3) OR LOWER(e.marca) LIKE LOWER($4) OR LOWER(e.modelo) LIKE LOWER($5))`;
      params = [term, term, term, term, term];
    }
    sql += ` ORDER BY e.id DESC`;
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT e.*, c.razon_social as cliente_nombre FROM equipos e LEFT JOIN clientes c ON e.cliente_id = c.id WHERE e.id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Equipo no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { equipo, modelo, marca, serie, contador_pag, nivel_tintas, cliente_id,
    insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
    insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia,
    actividad, observaciones } = req.body;
  try {
    const codigo = await generarCodigo();
    await pool.query(
      `INSERT INTO equipos (codigo, cliente_id, equipo, modelo, marca, serie, contador_pag, nivel_tintas,
        insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
        insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, actividad, observaciones)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
      [codigo, cliente_id || null, equipo, modelo, marca, serie || null, contador_pag || 0, nivel_tintas || null,
        insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null,
        insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null,
        insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null,
        actividad || null, observaciones || null]
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
    insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia,
    actividad, observaciones } = req.body;
  try {
    const existing = await pool.query("SELECT codigo FROM equipos WHERE id = $1", [id]);
    let codigo = existing.rows[0]?.codigo;
    if (!codigo) {
      codigo = await generarCodigo();
    }
    await pool.query(
      `UPDATE equipos SET codigo = $1, equipo = $2, modelo = $3, marca = $4, serie = $5, contador_pag = $6,
        nivel_tintas = $7, cliente_id = $8,
        insumo1 = $9, insumo2 = $10, insumo3 = $11, insumo4 = $12, insumo5 = $13, insumo6 = $14,
        insumo7 = $15, insumo8 = $16, insumo9 = $17, insumo10 = $18, insumo11 = $19, insumo12 = $20,
        averia = $21, actividad = $22, observaciones = $23 WHERE id = $24`,
      [codigo, equipo, modelo, marca, serie, contador_pag || 0, nivel_tintas, cliente_id || null,
        insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null,
        insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null,
        insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null,
        actividad || null, observaciones || null, id]
    );
    res.json({ msg: "Equipo actualizado", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id/reasignar", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { cliente_id } = req.body;
  try {
    await pool.query("UPDATE equipos SET cliente_id = $1 WHERE id = $2", [cliente_id || null, id]);
    res.json({ msg: "Equipo reasignado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM equipos WHERE id = $1", [id]);
    res.json({ msg: "Equipo eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
