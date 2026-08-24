import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware, adminOnly } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const [rows] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(codigo, 4) AS UNSIGNED)) AS num FROM clientes WHERE codigo LIKE 'CL-%'"
  );
  const num = rows[0].num || 0;
  return `CL-${String(num + 1).padStart(4, "0")}`;
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*,
        (SELECT IFNULL(GROUP_CONCAT(
          CONCAT(IFNULL(d.tipo_direccion, ''), '|', IFNULL(d.direccion, ''), '|', IFNULL(d.fono, ''), '|', IFNULL(d.ciudad, ''), '|', IFNULL(d.comuna, ''))
        SEPARATOR ';;'), '') FROM clientes_direcciones d WHERE d.cliente_id = c.id) as direcciones,
        (SELECT IFNULL(GROUP_CONCAT(
          CONCAT(IFNULL(co.nombre, ''), '|', IFNULL(co.email, ''), '|', IFNULL(co.fono, ''), '|', IFNULL(co.cargo, ''), '|', IFNULL(co.direccion, ''))
        SEPARATOR ';;'), '') FROM clientes_contactos co WHERE co.cliente_id = c.id) as contactos
      FROM clientes c
      ORDER BY c.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*,
        (SELECT IFNULL(GROUP_CONCAT(
          CONCAT(IFNULL(d.tipo_direccion, ''), '|', IFNULL(d.direccion, ''), '|', IFNULL(d.fono, ''), '|', IFNULL(d.ciudad, ''), '|', IFNULL(d.comuna, ''))
        SEPARATOR ';;'), '') FROM clientes_direcciones d WHERE d.cliente_id = c.id) as direcciones,
        (SELECT IFNULL(GROUP_CONCAT(
          CONCAT(IFNULL(co.nombre, ''), '|', IFNULL(co.email, ''), '|', IFNULL(co.fono, ''), '|', IFNULL(co.cargo, ''), '|', IFNULL(co.direccion, ''))
        SEPARATOR ';;'), '') FROM clientes_contactos co WHERE co.cliente_id = c.id) as contactos
      FROM clientes c
      WHERE c.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Cliente no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const {
    razon_social, giro, rut, direccion, ciudad, comuna, telefono, email,
    contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion,
    direcciones, contactos
  } = req.body;
  const codigo = await generarCodigo();
  try {
    // RUT único: verificar que no exista otro cliente con el mismo RUT
    if (rut && rut.trim()) {
      const rutLimpio = rut.replace(/[.\s]/g, "").toUpperCase();
      const [dup] = await pool.query("SELECT id, codigo FROM clientes WHERE REPLACE(REPLACE(rut, '.', ''), ' ', '') = ?", [rutLimpio]);
      if (dup.length > 0) {
        return res.status(400).json({ msg: `El cliente ya existe en el mantenedor con el código ${dup[0].codigo || "CL-????"}. No se creó un nuevo registro.` });
      }
    }
    const [result] = await pool.query(
      `INSERT INTO clientes (codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion]
    );
    const clienteId = result.insertId;

    if (direcciones && direcciones.length > 0) {
      for (const d of direcciones) {
        if (d.direccion && d.direccion.trim()) {
          await pool.query(
            "INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES (?, ?, ?, ?, ?, ?)",
            [clienteId, d.tipo_direccion || '', d.direccion, d.fono || '', d.ciudad || '', d.comuna || '']
          );
        }
      }
    }

    if (contactos && contactos.length > 0) {
      for (const c of contactos) {
        if (c.nombre && c.nombre.trim()) {
          await pool.query(
            "INSERT INTO clientes_contactos (cliente_id, nombre, email, fono, cargo, direccion) VALUES (?, ?, ?, ?, ?, ?)",
            [clienteId, c.nombre, c.email || '', c.fono || '', c.cargo || '', c.direccion || '']
          );
        }
      }
    }

    res.status(201).json({ msg: "Cliente creado", codigo, id: clienteId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    razon_social, giro, rut, direccion, ciudad, comuna, telefono, email,
    contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion,
    direcciones, contactos
  } = req.body;
  const connection = await pool.getConnection();
  try {
    // RUT único: verificar que no exista otro cliente con el mismo RUT (excluyendo este)
    if (rut && rut.trim()) {
      const rutLimpio = rut.replace(/[.\s]/g, "").toUpperCase();
      const [dup] = await pool.query(
        "SELECT id, codigo FROM clientes WHERE REPLACE(REPLACE(rut, '.', ''), ' ', '') = ? AND id != ?",
        [rutLimpio, id]
      );
      if (dup.length > 0) {
        connection.release();
        return res.status(400).json({ msg: `El RUT ya existe en el mantenedor con el código ${dup[0].codigo || "CL-????"}` });
      }
    }
    const [existing] = await connection.query("SELECT codigo FROM clientes WHERE id = ?", [id]);
    let codigo = existing[0]?.codigo;
    if (!codigo) codigo = await generarCodigo();

    await connection.beginTransaction();
    await connection.query(
      `UPDATE clientes SET codigo=?, razon_social=?, giro=?, rut=?, direccion=?, ciudad=?, comuna=?, telefono=?, email=?, contacto_nombre=?, contacto_email=?, contacto_fono=?, contacto_cargo=?, contacto_direccion=? WHERE id=?`,
      [codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion, id]
    );
    await connection.query("DELETE FROM clientes_direcciones WHERE cliente_id = ?", [id]);
    if (direcciones && direcciones.length > 0) {
      for (const d of direcciones) {
        if (d.direccion && d.direccion.trim()) {
          await connection.query(
            "INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES (?, ?, ?, ?, ?, ?)",
            [id, d.tipo_direccion || '', d.direccion, d.fono || '', d.ciudad || '', d.comuna || '']
          );
        }
      }
    }
    await connection.query("DELETE FROM clientes_contactos WHERE cliente_id = ?", [id]);
    if (contactos && contactos.length > 0) {
      for (const c of contactos) {
        if (c.nombre && c.nombre.trim()) {
          await connection.query(
            "INSERT INTO clientes_contactos (cliente_id, nombre, email, fono, cargo, direccion) VALUES (?, ?, ?, ?, ?, ?)",
            [id, c.nombre, c.email || '', c.fono || '', c.cargo || '', c.direccion || '']
          );
        }
      }
    }
    await connection.query(
      `UPDATE ordenes_trabajo SET cliente = ?, direccion = ?, comuna = ?, rut = ?, contacto = ?, fono_principal = ? WHERE cliente_id = ?`,
      [razon_social, direccion || null, comuna || null, rut || null, contacto_nombre || null, telefono || null, id]
    );
    await connection.commit();
    res.json({ msg: "Cliente actualizado", codigo });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  } finally {
    connection.release();
  }
});

router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM clientes WHERE id = ?", [id]);
    res.json({ msg: "Cliente eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
