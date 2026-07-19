import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const [rows] = await pool.query("SELECT codigo FROM clientes WHERE codigo LIKE 'CL-%' ORDER BY id DESC LIMIT 1");
  if (rows.length === 0) return "CL-0001";
  const num = parseInt(rows[0].codigo.split("-")[1], 10) || 0;
  return `CL-${String(num + 1).padStart(4, "0")}`;
}

router.get("/next-codigo", authMiddleware, async (req, res) => {
  try {
    const codigo = await generarCodigo();
    res.json({ codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*,
        COALESCE(GROUP_CONCAT(
          CONCAT(COALESCE(cd.tipo_direccion, ''), '|', COALESCE(cd.direccion, ''), '|', COALESCE(cd.fono, ''), '|', COALESCE(cd.ciudad, ''), '|', COALESCE(cd.comuna, ''))
          SEPARATOR ';;'
        ), '') as direcciones
      FROM clientes c
      LEFT JOIN clientes_direcciones cd ON c.id = cd.cliente_id
      WHERE c.activo = 1
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const {
    razon_social, giro, rut, direccion, ciudad, comuna, telefono, email,
    contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion,
    direcciones
  } = req.body;
  const codigo = await generarCodigo();
  try {
    const [result] = await pool.query(
      `INSERT INTO clientes (codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email || null, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion]
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
    direcciones
  } = req.body;
  try {
    const [rows] = await pool.query("SELECT codigo FROM clientes WHERE id = ?", [id]);
    let codigo = rows[0]?.codigo;
    if (!codigo) codigo = await generarCodigo();

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        `UPDATE clientes SET codigo=?, razon_social=?, giro=?, rut=?, direccion=?, ciudad=?, comuna=?, telefono=?, email=?, contacto_nombre=?, contacto_email=?, contacto_fono=?, contacto_cargo=?, contacto_direccion=? WHERE id=?`,
        [codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email || null, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion, id]
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
      await connection.commit();
      res.json({ msg: "Cliente actualizado", codigo });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id/equipos", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, codigo, equipo, marca, modelo, serie FROM equipos WHERE cliente_id = ? AND activo = 1",
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id/desactivar", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("UPDATE equipos SET cliente_id = NULL WHERE cliente_id = ?", [id]);
    await connection.query("UPDATE clientes SET activo = 0 WHERE id = ?", [id]);
    await connection.commit();
    res.json({ msg: "Cliente desactivado y equipos desvinculados" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  } finally {
    connection.release();
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE clientes SET activo = 0 WHERE id = ?", [id]);
    res.json({ msg: "Cliente desactivado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
