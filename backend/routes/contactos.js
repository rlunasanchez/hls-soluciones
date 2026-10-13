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
  const result = await pool.query(
    "SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 0) AS num FROM contactos WHERE codigo ~ '^CO-[0-9]+$'"
  );
  return `CO-${String(Number(result.rows[0].num) + 1).padStart(4, "0")}`;
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    // duenos: clientes a los que está vinculado ("id:codigo,id:codigo"); el buscador de
    // la ficha del cliente avisa si un contacto ya está en otro cliente.
    let sql = `SELECT contactos.*,
      (SELECT STRING_AGG(cl.id::text || ':' || cl.codigo, ',') FROM cliente_contactos v
        JOIN clientes cl ON cl.id = v.cliente_id WHERE v.contacto_id = contactos.id) AS duenos
      FROM contactos`;
    const params = [];
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      sql += ` WHERE (LOWER(codigo) LIKE LOWER($1) OR LOWER(nombre) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1) OR LOWER(fono) LIKE LOWER($1) OR LOWER(cargo) LIKE LOWER($1))`;
    }
    sql += ` ORDER BY id DESC`;
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contactos WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Contacto no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { nombre, email, fono, cargo, reutilizar } = req.body;
  try {
    if (!nombre || nombre.trim().length < 3) {
      return res.status(400).json({ msg: "Ingrese el nombre completo del contacto (mínimo 3 caracteres)" });
    }
    const dup = await pool.query(
      `SELECT id, codigo FROM contactos WHERE LOWER(TRIM(nombre)) = LOWER($1) LIMIT 1`,
      [nombre.trim()]
    );
    if (dup.rows.length > 0) {
      // Desde Cliente/OT/Cotización se llama con reutilizar: se usa el contacto
      // existente en vez de dar error (el mantenedor propio sigue siendo estricto).
      if (reutilizar) {
        return res.json({ msg: "Contacto existente", id: dup.rows[0].id, codigo: dup.rows[0].codigo, existente: true });
      }
      return res.status(400).json({ msg: `El contacto "${nombre.trim()}" ya existe en el mantenedor con el código ${dup.rows[0].codigo}. No se creó un nuevo registro.` });
    }
    const codigo = await generarCodigo();
    const ins = await pool.query(
      `INSERT INTO contactos (codigo, nombre, email, fono, cargo)
      VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [codigo, nombre.trim(), email || null, fono || null, cargo || null]
    );
    res.status(201).json({ msg: "Contacto creado", id: ins.rows[0].id, codigo });
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
    const existing = await pool.query("SELECT codigo FROM contactos WHERE id = $1", [id]);
    let codigo = existing.rows[0]?.codigo;
    if (!codigo) {
      codigo = await generarCodigo();
    }
    await pool.query(
      `UPDATE contactos SET codigo = $1, nombre = $2, email = $3, fono = $4, cargo = $5 WHERE id = $6`,
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
    // Un contacto del catálogo puede estar vinculado a varios clientes; borrarlo se los
    // quita a todos. Sin ?forzar=1 se avisa primero qué clientes lo usan.
    if (!req.query.forzar) {
      const usados = await pool.query(
        `SELECT cl.codigo, cl.razon_social FROM cliente_contactos v JOIN clientes cl ON cl.id = v.cliente_id
         WHERE v.contacto_id = $1 ORDER BY cl.razon_social`, [id]);
      if (usados.rows.length > 0) {
        return res.status(409).json({ msg: "El contacto está vinculado a clientes", clientes: usados.rows });
      }
    }
    await pool.query("DELETE FROM contactos WHERE id = $1", [id]);
    res.json({ msg: "Contacto eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
