import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const result = await pool.query(
    "SELECT CAST(SUBSTRING(codigo, 4) AS INTEGER) AS num FROM clientes WHERE codigo LIKE 'CL-%' ORDER BY num DESC LIMIT 1"
  );
  if (result.rows.length === 0) return "CL-0001";
  return `CL-${String(result.rows[0].num + 1).padStart(4, "0")}`;
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
        COALESCE(
          STRING_AGG(CONCAT_WS('|', cd.tipo_direccion, cd.direccion, cd.fono, cd.ciudad, cd.comuna), ';;' ORDER BY cd.id),
          ''
        ) as direcciones
      FROM clientes c
      LEFT JOIN clientes_direcciones cd ON c.id = cd.cliente_id
      GROUP BY c.id
      ORDER BY CAST(SUBSTRING(COALESCE(c.codigo, 'CL-0001'), 4) AS INTEGER) DESC
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
  const codigo = await generarCodigo();
  try {
    await pool.query(
      `INSERT INTO clientes (codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono,
        contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [codigo, razon_social, giro || null, rut || null, direccion || null, ciudad || null, comuna || null,
        telefono || null, contacto_nombre || null, contacto_email || null, contacto_fono || null,
        contacto_cargo || null, contacto_direccion || null]
    );
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
  try {
    const existente = await pool.query("SELECT codigo FROM clientes WHERE id = $1", [id]);
    let codigo = existente.rows[0]?.codigo;
    if (!codigo) {
      codigo = await generarCodigo();
    }

    await pool.query("BEGIN");

    await pool.query(
      `UPDATE clientes SET codigo = $1, razon_social = $2, giro = $3, rut = $4, direccion = $5,
        ciudad = $6, comuna = $7, telefono = $8,
        contacto_nombre = $9, contacto_email = $10, contacto_fono = $11,
        contacto_cargo = $12, contacto_direccion = $13
      WHERE id = $14`,
      [codigo, razon_social, giro || null, rut || null, direccion || null, ciudad || null, comuna || null,
        telefono || null, contacto_nombre || null, contacto_email || null, contacto_fono || null,
        contacto_cargo || null, contacto_direccion || null, id]
    );

    await pool.query("DELETE FROM clientes_direcciones WHERE cliente_id = $1", [id]);

    if (direcciones && direcciones.length > 0) {
      for (const d of direcciones) {
        if (d.direccion && d.direccion.trim()) {
          await pool.query(
            "INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES ($1, $2, $3, $4, $5, $6)",
            [id, d.tipo_direccion || null, d.direccion, d.fono || null, d.ciudad || null, d.comuna || null]
          );
        }
      }
    }

    await pool.query("COMMIT");
    res.json({ msg: "Cliente actualizado" });
  } catch (err) {
    await pool.query("ROLLBACK");
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
