import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const result = await pool.query("SELECT codigo FROM clientes WHERE codigo LIKE 'CL-%' ORDER BY id DESC LIMIT 1");
  if (result.rows.length === 0) return "CL-0001";
  const num = parseInt(result.rows[0].codigo.split("-")[1], 10) || 0;
  return `CL-${String(num + 1).padStart(4, "0")}`;
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
        COALESCE(STRING_AGG(
          CONCAT(COALESCE(cd.tipo_direccion, ''), '|', COALESCE(cd.direccion, ''), '|', COALESCE(cd.fono, ''), '|', COALESCE(cd.ciudad, ''), '|', COALESCE(cd.comuna, ''))
        , ';;'), '') as direcciones
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
    razon_social, giro, rut, direccion, ciudad, comuna, telefono, email,
    contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion,
    direcciones
  } = req.body;
  const codigo = await generarCodigo();
  try {
    const result = await pool.query(
      `INSERT INTO clientes (codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion]
    );
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
    razon_social, giro, rut, direccion, ciudad, comuna, telefono, email,
    contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion,
    direcciones
  } = req.body;
  try {
    const result = await pool.query("SELECT codigo FROM clientes WHERE id = $1", [id]);
    let codigo = result.rows[0]?.codigo;
    if (!codigo) codigo = await generarCodigo();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE clientes SET codigo=$1, razon_social=$2, giro=$3, rut=$4, direccion=$5, ciudad=$6, comuna=$7, telefono=$8, email=$9, contacto_nombre=$10, contacto_email=$11, contacto_fono=$12, contacto_cargo=$13, contacto_direccion=$14 WHERE id=$15`,
        [codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion, id]
      );
      await client.query("DELETE FROM clientes_direcciones WHERE cliente_id = $1", [id]);
      if (direcciones && direcciones.length > 0) {
        for (const d of direcciones) {
          if (d.direccion && d.direccion.trim()) {
            await client.query(
              "INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES ($1, $2, $3, $4, $5, $6)",
              [id, d.tipo_direccion || '', d.direccion, d.fono || '', d.ciudad || '', d.comuna || '']
            );
          }
        }
      }
      await client.query("COMMIT");
      res.json({ msg: "Cliente actualizado", codigo });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM clientes WHERE id = $1", [id]);
    res.json({ msg: "Cliente eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
