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
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO clientes (razon_social, giro, rut, direccion, ciudad, comuna, telefono, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [razon_social, giro, rut, direccion, ciudad, comuna, telefono, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion]
    );
    const clienteId = result.insertId;
    if (direcciones && direcciones.length > 0) {
      for (const dir of direcciones) {
        await conn.query(
          `INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES (?, ?, ?, ?, ?, ?)`,
          [clienteId, dir.tipo_direccion, dir.direccion, dir.fono, dir.ciudad, dir.comuna]
        );
      }
    }
    await conn.commit();
    res.status(201).json({ msg: "Cliente creado" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  } finally {
    conn.release();
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    razon_social, giro, rut, direccion, ciudad, comuna, telefono,
    contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion,
    direcciones
  } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE clientes SET razon_social=?, giro=?, rut=?, direccion=?, ciudad=?, comuna=?, telefono=?, contacto_nombre=?, contacto_email=?, contacto_fono=?, contacto_cargo=?, contacto_direccion=? WHERE id=?`,
      [razon_social, giro, rut, direccion, ciudad, comuna, telefono, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion, id]
    );
    await conn.query("DELETE FROM clientes_direcciones WHERE cliente_id=?", [id]);
    if (direcciones && direcciones.length > 0) {
      for (const dir of direcciones) {
        await conn.query(
          `INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES (?, ?, ?, ?, ?, ?)`,
          [id, dir.tipo_direccion, dir.direccion, dir.fono, dir.ciudad, dir.comuna]
        );
      }
    }
    await conn.commit();
    res.json({ msg: "Cliente actualizado" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  } finally {
    conn.release();
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