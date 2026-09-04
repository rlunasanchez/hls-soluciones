import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

async function calcularSiguienteFolio() {
  const result = await pool.query("SELECT MAX(folio) AS maximo FROM cotizaciones");
  const maximo = result.rows[0]?.maximo || 0;
  return Math.max(maximo + 1, 2800);
}

router.get("/", authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const cotizacionesResult = await pool.query(
      `SELECT id, folio, fecha_emision, fecha_valido_hasta, condicion, pais, glosa,
        cliente_id, cliente_rut, cliente_razon_social,
        contacto_nombre, contacto_fono, contacto_email,
        ejecutivo, ejecutivo_fono, ejecutivo_email,
        items, orden_id, orden_numero, fecha_creacion, fecha_actualizacion
       FROM cotizaciones ORDER BY id DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const totalResult = await pool.query("SELECT COUNT(*) as total FROM cotizaciones");
    res.json({
      cotizaciones: cotizacionesResult.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(parseInt(totalResult.rows[0].total) / limit),
        totalItems: parseInt(totalResult.rows[0].total),
        itemsPerPage: limit
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/siguiente-folio", authMiddleware, async (req, res) => {
  try {
    res.json({ folio: await calcularSiguienteFolio() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cotizaciones WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: "Cotización no encontrada" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const {
    fechaEmision, fechaValidoHasta, condicion, pais, glosa,
    clienteId, clienteRut, clienteRazonSocial,
    contactoNombre, contactoFono, contactoEmail,
    ejecutivoFono, ejecutivoEmail,
    items, ordenId, ordenNumero
  } = req.body;

  // Cliente es opcional: una cotización "suelta" (creada sin venir de una
  // OT ni de un Cliente) puede guardarse sin razón social todavía.

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const folio = await calcularSiguienteFolio();
    // El ejecutivo se toma del usuario autenticado, no de lo que mande el
    // cliente HTTP: es quien está usando la app en ese momento, no un dato
    // editable a mano (evita que alguien se atribuya la cotización de otro).
    const ejecutivo = req.user.usuario;

    const resultado = await client.query(
      `INSERT INTO cotizaciones (folio, fecha_emision, fecha_valido_hasta, condicion, pais, glosa,
        cliente_id, cliente_rut, cliente_razon_social,
        contacto_nombre, contacto_fono, contacto_email,
        ejecutivo, ejecutivo_fono, ejecutivo_email,
        items, orden_id, orden_numero)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id`,
      [
        folio, fechaEmision, fechaValidoHasta || null, condicion || null, pais || null, glosa || null,
        clienteId || null, clienteRut || null, clienteRazonSocial || '',
        contactoNombre || null, contactoFono || null, contactoEmail || null,
        ejecutivo, ejecutivoFono || null, ejecutivoEmail || null,
        items ? JSON.stringify(items) : null, ordenId || null, ordenNumero || null
      ]
    );

    await client.query("COMMIT");
    res.status(201).json({ msg: "Cotización creada", id: resultado.rows[0].id, folio });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  } finally {
    client.release();
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    fechaEmision, fechaValidoHasta, condicion, pais, glosa,
    clienteId, clienteRut, clienteRazonSocial,
    contactoNombre, contactoFono, contactoEmail,
    ejecutivo, ejecutivoFono, ejecutivoEmail,
    items, ordenId, ordenNumero
  } = req.body;

  // Cliente es opcional: una cotización "suelta" puede guardarse sin
  // razón social todavía.

  try {
    await pool.query(
      `UPDATE cotizaciones SET fecha_emision = $1, fecha_valido_hasta = $2, condicion = $3, pais = $4, glosa = $5,
        cliente_id = $6, cliente_rut = $7, cliente_razon_social = $8,
        contacto_nombre = $9, contacto_fono = $10, contacto_email = $11,
        ejecutivo = $12, ejecutivo_fono = $13, ejecutivo_email = $14,
        items = $15, orden_id = $16, orden_numero = $17
       WHERE id = $18`,
      [
        fechaEmision, fechaValidoHasta || null, condicion || null, pais || null, glosa || null,
        clienteId || null, clienteRut || null, clienteRazonSocial || '',
        contactoNombre || null, contactoFono || null, contactoEmail || null,
        ejecutivo || null, ejecutivoFono || null, ejecutivoEmail || null,
        items ? JSON.stringify(items) : null, ordenId || null, ordenNumero || null,
        id
      ]
    );
    res.json({ msg: "Cotización actualizada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM cotizaciones WHERE id = $1", [req.params.id]);
    res.json({ msg: "Cotización eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
