import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

// Mantenedor de Contactos: catálogo global, independiente de Cliente (mismo
// espíritu que Equipos — sin FK a clientes). Se "llama" desde la OT/Cotización
// buscando y copiando los campos, no por referencia viva.
async function generarCodigo() {
  const [rows] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(codigo, 4) AS UNSIGNED)) AS num FROM contactos WHERE codigo LIKE 'CO-%'"
  );
  const num = rows[0].num || 0;
  return `CO-${String(num + 1).padStart(4, "0")}`;
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `SELECT * FROM contactos`;
    let conditions = [];
    let params = [];
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(`(LOWER(codigo) LIKE LOWER(?) OR LOWER(nombre) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?) OR LOWER(fono) LIKE LOWER(?) OR LOWER(cargo) LIKE LOWER(?))`);
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
      "SELECT * FROM contactos WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: "Contacto no encontrado" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { nombre, email, fono, cargo } = req.body;
  try {
    if (!nombre || nombre.trim().length < 3) {
      return res.status(400).json({ msg: "Ingrese el nombre completo del contacto (mínimo 3 caracteres)" });
    }
    const [dup] = await pool.query(
      `SELECT codigo FROM contactos WHERE LOWER(TRIM(nombre)) = LOWER(?) LIMIT 1`,
      [nombre.trim()]
    );
    if (dup.length > 0) {
      return res.status(400).json({ msg: `El contacto "${nombre.trim()}" ya existe en el mantenedor con el código ${dup[0].codigo}. No se creó un nuevo registro.` });
    }
    const codigo = await generarCodigo();
    await pool.query(
      `INSERT INTO contactos (codigo, nombre, email, fono, cargo)
      VALUES (?, ?, ?, ?, ?)`,
      [codigo, nombre.trim(), email || null, fono || null, cargo || null]
    );
    res.status(201).json({ msg: "Contacto creado", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nombre, email, fono, cargo } = req.body;
  try {
    if (!nombre || nombre.trim().length < 3) {
      return res.status(400).json({ msg: "Ingrese el nombre completo del contacto (mínimo 3 caracteres)" });
    }
    const [existing] = await pool.query("SELECT codigo FROM contactos WHERE id = ?", [id]);
    let codigo = existing[0]?.codigo;
    if (!codigo) {
      codigo = await generarCodigo();
    }
    await pool.query(
      `UPDATE contactos SET codigo = ?, nombre = ?, email = ?, fono = ?, cargo = ? WHERE id = ?`,
      [codigo, nombre.trim(), email || null, fono || null, cargo || null, id]
    );
    res.json({ msg: "Contacto actualizado", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM contactos WHERE id = ?", [id]);
    res.json({ msg: "Contacto eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
