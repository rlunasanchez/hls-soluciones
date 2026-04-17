import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [equipos] = await pool.query("SELECT * FROM equipos ORDER BY equipo, modelo");
    res.json(equipos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  console.log("POST Data:", req.body);
  const { equipo, modelo, marca, serie, contador_pag, nivel_tintas, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia } = req.body;
  const escape = (v) => (v === '' || v === undefined || v === null) ? 'NULL' : "'" + String(v).replace(/'/g, "''") + "'";
  const sql = `INSERT INTO equipos (equipo, modelo, marca, serie, contador_pag, nivel_tintas, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia) VALUES (${escape(equipo)}, ${escape(modelo)}, ${escape(marca)}, ${escape(serie)}, ${escape(contador_pag)}, ${escape(nivel_tintas)}, ${escape(insumo1)}, ${escape(insumo2)}, ${escape(insumo3)}, ${escape(insumo4)}, ${escape(insumo5)}, ${escape(insumo6)}, ${escape(insumo7)}, ${escape(insumo8)}, ${escape(insumo9)}, ${escape(insumo10)}, ${escape(insumo11)}, ${escape(insumo12)}, ${escape(averia)})`;
  console.log("Insert SQL:", sql);
  try {
    await pool.query(sql);
    res.status(201).json({ msg: "Equipo creado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { equipo, modelo, marca, serie, contador_pag, nivel_tintas, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia } = req.body;
  try {
    await pool.query(
      "UPDATE equipos SET equipo = ?, modelo = ?, marca = ?, serie = ?, contador_pag = ?, nivel_tintas = ?, insumo1 = ?, insumo2 = ?, insumo3 = ?, insumo4 = ?, insumo5 = ?, insumo6 = ?, insumo7 = ?, insumo8 = ?, insumo9 = ?, insumo10 = ?, insumo11 = ?, insumo12 = ?, averia = ? WHERE id = ?",
      [equipo, modelo, marca, serie, contador_pag || 0, nivel_tintas, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, id]
    );
    res.json({ msg: "Equipo actualizado" });
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