import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware, adminOnly } from "../middleware/authMiddleware.js";
import consultaRouter from "./equiposConsulta.js";
import { sincronizarOrdenesDeEquipo, reenlazarOrdenesDeEquipo, desvincularOrdenes } from "./ordenesVinculos.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const [rows] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(codigo, 4) AS UNSIGNED)) AS num FROM equipos WHERE codigo LIKE 'EQ-%'"
  );
  const num = rows[0].num || 0;
  return `EQ-${String(num + 1).padStart(4, "0")}`;
}

// Consultas: listado, búsqueda y verificación (ver equiposConsulta.js). Va antes de las rutas con /:id.
router.use("/", consultaRouter);

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
    if (!equipo || equipo.trim().length < 2) {
      return res.status(400).json({ msg: "Ingrese el Equipo (mínimo 2 caracteres) antes de guardar" });
    }
    const [dup] = await pool.query(
      `SELECT codigo FROM equipos
      WHERE LOWER(TRIM(equipo)) = LOWER(?) AND LOWER(TRIM(IFNULL(marca,''))) = LOWER(?) AND LOWER(TRIM(IFNULL(modelo,''))) = LOWER(?)
      LIMIT 1`,
      [equipo.trim(), (marca || '').trim(), (modelo || '').trim()]
    );
    if (dup.length > 0) {
      return res.status(400).json({ msg: `El equipo ${equipo.trim()} ${(marca || '').trim()} ${(modelo || '').trim()} ya existe en el mantenedor con el código ${dup[0].codigo}. No se creó un nuevo registro.` });
    }
    const codigo = await generarCodigo();
    const [ins] = await pool.query(
      `INSERT INTO equipos (codigo, equipo, modelo, marca, serie)
      VALUES (?, ?, ?, ?, ?)`,
      [codigo, equipo.trim(), modelo || '', marca || '', serie || null]
    );
    await reenlazarOrdenesDeEquipo(pool, ins.insertId, { equipo, marca, modelo });
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
    if (!equipo || equipo.trim().length < 2) {
      return res.status(400).json({ msg: "Ingrese el Equipo (mínimo 2 caracteres) antes de guardar" });
    }
    // Igual que al crear: no puede quedar con el mismo Equipo + Marca + Modelo que otro equipo
    const [dup] = await pool.query(
      `SELECT codigo FROM equipos
      WHERE id <> ? AND LOWER(TRIM(equipo)) = LOWER(?) AND LOWER(TRIM(IFNULL(marca,''))) = LOWER(?) AND LOWER(TRIM(IFNULL(modelo,''))) = LOWER(?)
      LIMIT 1`,
      [id, equipo.trim(), (marca || '').trim(), (modelo || '').trim()]
    );
    if (dup.length > 0) {
      return res.status(400).json({ msg: `Ya existe otro equipo ${equipo.trim()} ${(marca || '').trim()} ${(modelo || '').trim()} en el mantenedor con el código ${dup[0].codigo}.` });
    }
    const [existing] = await pool.query("SELECT codigo FROM equipos WHERE id = ?", [id]);
    let codigo = existing[0]?.codigo;
    if (!codigo) {
      codigo = await generarCodigo();
    }
    await pool.query(
      `UPDATE equipos SET codigo = ?, equipo = ?, modelo = ?, marca = ?, serie = ? WHERE id = ?`,
      [codigo, equipo.trim(), modelo || '', marca || '', serie || null, id]
    );
    // Las OT vinculadas a este equipo toman el Equipo, Marca y Modelo nuevos (la serie es de cada OT)
    await sincronizarOrdenesDeEquipo(pool, id, { equipo: equipo.trim(), marca: marca || '', modelo: modelo || '' });
    res.json({ msg: "Equipo actualizado", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM equipos WHERE id = ?", [id]);
    await desvincularOrdenes(pool, "equipo", id);
    res.json({ msg: "Equipo eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
