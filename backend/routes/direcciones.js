import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { sincronizarOrdenesDeDireccion, desvincularOrdenes } from "./ordenesVinculos.js";

dotenv.config();
const router = express.Router();

// Mantenedor de Direcciones: catálogo global, independiente de Cliente
// (mismo criterio que Contactos y Equipos — sin FK). Se "llama" desde la
// OT/Cotización buscando y copiando los campos, no por referencia viva.
async function generarCodigo() {
  const result = await pool.query(
    "SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 0) AS num FROM direcciones WHERE codigo ~ '^DI-[0-9]+$'"
  );
  return `DI-${String(Number(result.rows[0].num) + 1).padStart(4, "0")}`;
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    // duenos: clientes a los que está vinculada ("id:codigo,id:codigo"); el buscador de
    // la ficha del cliente avisa si una dirección ya está en otro cliente.
    let sql = `SELECT direcciones.*,
      (SELECT STRING_AGG(cl.id::text || ':' || cl.codigo, ',') FROM cliente_direcciones v
        JOIN clientes cl ON cl.id = v.cliente_id WHERE v.direccion_id = direcciones.id) AS duenos
      FROM direcciones`;
    const params = [];
    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      sql += ` WHERE (LOWER(codigo) LIKE LOWER($1) OR LOWER(direccion) LIKE LOWER($1) OR LOWER(ciudad) LIKE LOWER($1) OR LOWER(comuna) LIKE LOWER($1))`;
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
    const result = await pool.query("SELECT * FROM direcciones WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Dirección no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { direccion, ciudad, comuna, reutilizar } = req.body;
  try {
    if (!direccion || direccion.trim().length < 5) {
      return res.status(400).json({ msg: "Ingrese la dirección completa (mínimo 5 caracteres)" });
    }
    // Duplicado por dirección sola: si el texto de la dirección ya existe en el
    // mantenedor, se enlaza a ese registro en vez de crear otro (aunque ciudad/
    // comuna vengan vacías o distintas en esta carga puntual).
    const dup = await pool.query(
      `SELECT id, codigo FROM direcciones
      WHERE LOWER(TRIM(direccion)) = LOWER($1)
      LIMIT 1`,
      [direccion.trim()]
    );
    if (dup.rows.length > 0) {
      // Desde Cliente/OT/Cotización se llama con reutilizar: se usa la dirección
      // existente en vez de dar error (el mantenedor propio sigue siendo estricto).
      if (reutilizar) {
        return res.json({ msg: "Dirección existente", id: dup.rows[0].id, codigo: dup.rows[0].codigo, existente: true });
      }
      return res.status(400).json({ msg: `La dirección "${direccion.trim()}" ya existe en el mantenedor con el código ${dup.rows[0].codigo}. No se creó un nuevo registro.` });
    }
    const codigo = await generarCodigo();
    const ins = await pool.query(
      `INSERT INTO direcciones (codigo, direccion, ciudad, comuna)
      VALUES ($1, $2, $3, $4) RETURNING id`,
      [codigo, direccion.trim(), ciudad || null, comuna || null]
    );
    res.status(201).json({ msg: "Dirección creada", id: ins.rows[0].id, codigo });
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
    const existing = await pool.query("SELECT codigo FROM direcciones WHERE id = $1", [id]);
    let codigo = existing.rows[0]?.codigo;
    if (!codigo) {
      codigo = await generarCodigo();
    }
    await pool.query(
      `UPDATE direcciones SET codigo = $1, direccion = $2, ciudad = $3, comuna = $4 WHERE id = $5`,
      [codigo, direccion.trim(), ciudad || null, comuna || null, id]
    );
    // Las OT vinculadas a esta dirección toman sus datos nuevos
    await sincronizarOrdenesDeDireccion(pool, id, { direccion: direccion.trim(), ciudad, comuna });
    res.json({ msg: "Dirección actualizada", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // Una dirección del catálogo puede estar vinculada a varios clientes; borrarla se la
    // quita a todos. Sin ?forzar=1 se avisa primero qué clientes la usan.
    if (!req.query.forzar) {
      const usados = await pool.query(
        `SELECT cl.codigo, cl.razon_social FROM cliente_direcciones v JOIN clientes cl ON cl.id = v.cliente_id
         WHERE v.direccion_id = $1 ORDER BY cl.razon_social`, [id]);
      if (usados.rows.length > 0) {
        return res.status(409).json({ msg: "La dirección está vinculada a clientes", clientes: usados.rows });
      }
    }
    await pool.query("DELETE FROM direcciones WHERE id = $1", [id]);
    await desvincularOrdenes(pool, "direccion", id);
    res.json({ msg: "Dirección eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
