import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [clientes] = await pool.query(`
      SELECT c.*, GROUP_CONCAT(CONCAT(cd.tipo_direccion, '|', cd.direccion, '|', cd.fono, '|', cd.ciudad, '|', cd.comuna) SEPARATOR ';;') as direcciones
      FROM clientes c
      LEFT JOIN clientes_direcciones cd ON c.id = cd.cliente_id
      GROUP BY c.id
      ORDER BY c.razon_social
    `);
    res.json(clientes);
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
  const sql = `INSERT INTO clientes (razon_social, giro, rut, direccion, ciudad, comuna, telefono, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion) VALUES (${escape(razon_social)}, ${escape(giro)}, ${escape(rut)}, ${escape(direccion)}, ${escape(ciudad)}, ${escape(comuna)}, ${escape(telefono)}, ${escape(contacto_nombre)}, ${escape(contacto_email)}, ${escape(contacto_fono)}, ${escape(contacto_cargo)}, ${escape(contacto_direccion)})`;
  console.log("Insert cliente:", sql);
  try {
    await pool.query(sql);
    res.status(201).json({ msg: "Cliente creado" });
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
  const sql = `UPDATE clientes SET razon_social=${escape(razon_social)}, giro=${escape(giro)}, rut=${escape(rut)}, direccion=${escape(direccion)}, ciudad=${escape(ciudad)}, comuna=${escape(comuna)}, telefono=${escape(telefono)}, contacto_nombre=${escape(contacto_nombre)}, contacto_email=${escape(contacto_email)}, contacto_fono=${escape(contacto_fono)}, contacto_cargo=${escape(contacto_cargo)}, contacto_direccion=${escape(contacto_direccion)} WHERE id=${id}`;
  console.log("Update cliente:", sql);
  const connection = await pool.getConnection();
  try {
    await connection.query(sql);
    await connection.query("DELETE FROM clientes_direcciones WHERE cliente_id = ?", [id]);
    if (direcciones && direcciones.length > 0) {
      for (const d of direcciones) {
        if (d.direccion && d.direccion.trim()) {
          await connection.query(
            "INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES (?, ?, ?, ?, ?, ?)",
            [id, d.tipo_direccion || null, d.direccion, d.fono || null, d.ciudad || null, d.comuna || null]
          );
        }
      }
    }
    res.json({ msg: "Cliente actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  } finally {
    connection.release();
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM clientes WHERE id=?", [id]);
    res.json({ msg: "Cliente eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;