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
  const { equipo, modelo, marca, serie, contador_pag, nivel_tintas, insumo1, insumo2, averia } = req.body;
  try {
    await pool.query(
      "INSERT INTO equipos (equipo, modelo, marca, serie, contador_pag, nivel_tintas, insumo1, insumo2, averia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [equipo, modelo, marca, serie, contador_pag || 0, nivel_tintas, insumo1, insumo2, averia]
    );
    res.status(201).json({ msg: "Equipo creado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { equipo, modelo, marca, serie, contador_pag, nivel_tintas, insumo1, insumo2, averia } = req.body;
  try {
    await pool.query(
      "UPDATE equipos SET equipo = ?, modelo = ?, marca = ?, serie = ?, contador_pag = ?, nivel_tintas = ?, insumo1 = ?, insumo2 = ?, averia = ? WHERE id = ?",
      [equipo, modelo, marca, serie, contador_pag || 0, nivel_tintas, insumo1, insumo2, averia, id]
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