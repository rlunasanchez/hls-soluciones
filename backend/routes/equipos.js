import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const [rows] = await pool.query("SELECT codigo FROM equipos WHERE codigo LIKE 'EQ-%' ORDER BY id DESC LIMIT 1");
  if (rows.length === 0) return "EQ-0001";
  const num = parseInt(rows[0].codigo.split("-")[1], 10) || 0;
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
    const { q, cliente_id } = req.query;
    let sql = `SELECT e.*, c.razon_social as cliente_nombre, c.rut as cliente_rut, c.codigo as cliente_codigo
      FROM equipos e
      LEFT JOIN clientes c ON e.cliente_id = c.id`;
    let params = [];
    const conditions = ["e.activo = 1"];
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(`(LOWER(e.codigo) LIKE LOWER(?) OR LOWER(e.serie) LIKE LOWER(?) OR LOWER(e.equipo) LIKE LOWER(?) OR LOWER(e.marca) LIKE LOWER(?))`);
      params.push(term, term, term, term);
    }
    if (cliente_id) {
      conditions.push(`e.cliente_id = ?`);
      params.push(cliente_id);
    }
    sql += ` WHERE ${conditions.join(" AND ")}`;
    sql += ` ORDER BY e.id DESC`;
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
      `SELECT e.*, c.razon_social as cliente_nombre, c.rut as cliente_rut, c.codigo as cliente_codigo
      FROM equipos e
      LEFT JOIN clientes c ON e.cliente_id = c.id
      WHERE e.id = ? AND e.activo = 1`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ msg: "Equipo no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { equipo, modelo, marca, serie, contador_pag, nivel_tintas, cliente_id,
    insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
    insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, actividad, observaciones } = req.body;
  try {
    const codigo = await generarCodigo();
    await pool.query(
      `INSERT INTO equipos (codigo, cliente_id, equipo, modelo, marca, serie, contador_pag, nivel_tintas,
        insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
        insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, actividad, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, actividad, observaciones } = req.body;
  try {
    const [rows] = await pool.query("SELECT codigo FROM equipos WHERE id = ?", [id]);
    let codigo = rows[0]?.codigo;
    if (!codigo) {
      codigo = await generarCodigo();
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        `UPDATE equipos SET codigo = ?, equipo = ?, modelo = ?, marca = ?, serie = ?, contador_pag = ?,
          nivel_tintas = ?, cliente_id = ?,
          insumo1 = ?, insumo2 = ?, insumo3 = ?, insumo4 = ?, insumo5 = ?, insumo6 = ?,
          insumo7 = ?, insumo8 = ?, insumo9 = ?, insumo10 = ?, insumo11 = ?, insumo12 = ?,
          averia = ?, actividad = ?, observaciones = ? WHERE id = ?`,
        [codigo, equipo, modelo, marca, serie, contador_pag || 0, nivel_tintas, cliente_id || null,
          insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null,
          insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null,
          insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null,
          averia || null, actividad || null, observaciones || null, id]
      );
      await connection.query(
        `UPDATE ordenes_trabajo SET equipo = ?, modelo = ?, marca = ?, serie = ?,
          contador_pag_out = ?, nivel_tinta = ?,
          insumo1 = ?, insumo2 = ?, insumo3 = ?, insumo4 = ?, insumo5 = ?, insumo6 = ?,
          insumo7 = ?, insumo8 = ?, insumo9 = ?, insumo10 = ?, insumo11 = ?, insumo12 = ?,
          averia = ?, actividad = ?, observaciones = ? WHERE equipo_id = ?`,
        [equipo, modelo, marca, serie, contador_pag || 0, nivel_tintas || null,
          insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null,
          insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null,
          insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null,
          averia || null, actividad || null, observaciones || null, id]
      );
      await connection.commit();
      res.json({ msg: "Equipo actualizado", codigo });
    } catch (err2) {
      await connection.rollback();
      throw err2;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id/reasignar", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nuevo_cliente_id } = req.body;
  try {
    await pool.query("UPDATE equipos SET cliente_id = ? WHERE id = ?", [nuevo_cliente_id || null, id]);
    res.json({ msg: "Equipo reasignado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE equipos SET activo = 0 WHERE id = ?", [id]);
    res.json({ msg: "Equipo desactivado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
