import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const result = await pool.query("SELECT MAX(id) as max_id FROM clientes");
  const maxId = result.rows[0].max_id || 0;
  return `CL-${String(maxId + 1).padStart(4, "0")}`;
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
    const result = await pool.query(`
      SELECT c.*,
        COALESCE(string_agg(
          COALESCE(cd.tipo_direccion, '') || '|' || COALESCE(cd.direccion, '') || '|' || 
          COALESCE(cd.fono, '') || '|' || COALESCE(cd.ciudad, '') || '|' || COALESCE(cd.comuna, ''), 
          ';;' ORDER BY cd.id
        ), '') as direcciones
      FROM clientes c
      LEFT JOIN clientes_direcciones cd ON c.id = cd.cliente_id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const {
    razon_social, giro, rut, direccion, ciudad, comuna, telefono,
    contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion,
    direcciones
  } = req.body;
  const escape = (v) => (v === '' || v === undefined || v === null) ? 'NULL' : "'" + String(v).replace(/'/g, "''") + "'";
  const codigo = await generarCodigo();
  const sql = `INSERT INTO clientes (codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion) VALUES (${escape(codigo)}, ${escape(razon_social)}, ${escape(giro)}, ${escape(rut)}, ${escape(direccion)}, ${escape(ciudad)}, ${escape(comuna)}, ${escape(telefono)}, ${escape(contacto_nombre)}, ${escape(contacto_email)}, ${escape(contacto_fono)}, ${escape(contacto_cargo)}, ${escape(contacto_direccion)}) RETURNING id`;
  try {
    const result = await pool.query(sql);
    const clienteId = result.rows[0].id;

    if (direcciones && direcciones.length > 0) {
      for (const d of direcciones) {
        if (d.direccion && d.direccion.trim()) {
          await pool.query(
            "INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES ($1, $2, $3, $4, $5, $6)",
            [clienteId, d.tipo_direccion || '', d.direccion, d.fono || '', d.ciudad || '', d.comuna || '']
          );
        }
      }
    }

    res.status(201).json({ msg: "Cliente creado", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    razon_social, giro, rut, direccion, ciudad, comuna, telefono,
    contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion,
    direcciones
  } = req.body;
  const escape = (v) => (v === '' || v === undefined || v === null) ? 'NULL' : "'" + String(v).replace(/'/g, "''") + "'";
  const result = await pool.query("SELECT codigo FROM clientes WHERE id = $1", [id]);
  let codigo = result.rows[0]?.codigo;
  if (!codigo) {
    codigo = await generarCodigo();
  }
  const sql = `UPDATE clientes SET codigo=${escape(codigo)}, razon_social=${escape(razon_social)}, giro=${escape(giro)}, rut=${escape(rut)}, direccion=${escape(direccion)}, ciudad=${escape(ciudad)}, comuna=${escape(comuna)}, telefono=${escape(telefono)}, contacto_nombre=${escape(contacto_nombre)}, contacto_email=${escape(contacto_email)}, contacto_fono=${escape(contacto_fono)}, contacto_cargo=${escape(contacto_cargo)}, contacto_direccion=${escape(contacto_direccion)} WHERE id=${id}`;
  try {
    await pool.query(sql);
    await pool.query("DELETE FROM clientes_direcciones WHERE cliente_id = $1", [id]);
    if (direcciones && direcciones.length > 0) {
      for (const d of direcciones) {
        if (d.direccion && d.direccion.trim()) {
          await pool.query(
            "INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES ($1, $2, $3, $4, $5, $6)",
            [id, d.tipo_direccion || '', d.direccion, d.fono || '', d.ciudad || '', d.comuna || '']
          );
        }
      }
    }
    res.json({ msg: "Cliente actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM clientes WHERE id=$1", [id]);
    res.json({ msg: "Cliente eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;