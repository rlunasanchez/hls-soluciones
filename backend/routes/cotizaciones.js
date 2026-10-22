import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

async function calcularSiguienteFolio() {
  const result = await pool.query("SELECT MAX(folio) AS maximo FROM cotizaciones");
  const maximo = result.rows[0]?.maximo || 0;
  return Math.max(maximo + 1, 2800);
}

// Si el cliente de la OT se borró y se registró de nuevo, su id viejo ya no existe y la cotización
// no se podría guardar (clave foránea): en ese caso se guarda sin vínculo al cliente.
async function clienteIdExistente(db, clienteId) {
  if (!clienteId) return null;
  const [rows] = await db.query("SELECT id FROM clientes WHERE id = ?", [clienteId]);
  return rows.length > 0 ? clienteId : null;
}

router.get("/", authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const ordenId = req.query.orden_id ? parseInt(req.query.orden_id) : null;
  const where = ordenId ? "WHERE orden_id = $1" : "";
  const whereParams = ordenId ? [ordenId] : [];
  const limitParamNum = whereParams.length + 1;
  const offsetParamNum = whereParams.length + 2;

  try {
    const cotizacionesResult = await pool.query(
      `SELECT id, folio, fecha_emision, fecha_valido_hasta, condicion, glosa,
        cliente_id, cliente_rut, cliente_razon_social,
        cliente_direccion, cliente_ciudad, cliente_comuna, cliente_direccion_id, cliente_telefono, cliente_email,
        contacto_nombre, contacto_fono, contacto_email, contacto_cargo, contacto_id, contacto_direccion, contacto_ciudad, contacto_comuna, direccion_id, contactos_extra,
        ejecutivo, ejecutivo_fono, ejecutivo_email,
        items, orden_id, orden_numero, fecha_creacion, fecha_actualizacion
       FROM cotizaciones ${where} ORDER BY id DESC LIMIT $${limitParamNum} OFFSET $${offsetParamNum}`,
      [...whereParams, limit, offset]
    );
    const totalResult = await pool.query(`SELECT COUNT(*) as total FROM cotizaciones ${where}`, whereParams);
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
    fechaEmision, fechaValidoHasta, condicion, glosa,
    clienteId, clienteRut, clienteRazonSocial,
    clienteDireccion, clienteCiudad, clienteComuna, clienteDireccionId, clienteTelefono, clienteEmail,
    contactoNombre, contactoFono, contactoEmail, contactoCargo, contactoId, contactoDireccion, contactoCiudad, contactoComuna, direccionId, contactosExtra,
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
    // Se prioriza el Nombre cargado en Usuarios; si todavía no lo tiene,
    // se usa el usuario de login como respaldo (nunca queda vacío).
    const ejecutivo = req.user.nombre || req.user.usuario;

    const resultado = await client.query(
      `INSERT INTO cotizaciones (folio, fecha_emision, fecha_valido_hasta, condicion, glosa,
        cliente_id, cliente_rut, cliente_razon_social,
        cliente_direccion, cliente_ciudad, cliente_comuna, cliente_direccion_id, cliente_telefono, cliente_email,
        contacto_nombre, contacto_fono, contacto_email, contacto_cargo, contacto_id, contacto_direccion, contacto_ciudad, contacto_comuna, direccion_id, contactos_extra,
        ejecutivo, ejecutivo_fono, ejecutivo_email,
        items, orden_id, orden_numero)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
       RETURNING id`,
      [
        folio, fechaEmision, fechaValidoHasta || null, condicion || null, glosa || null,
        await clienteIdExistente(connection, clienteId), clienteRut || null, clienteRazonSocial || '',
        clienteDireccion || null, clienteCiudad || null, clienteComuna || null, clienteDireccionId || null, clienteTelefono || null, clienteEmail || null,
        contactoNombre || null, contactoFono || null, contactoEmail || null, contactoCargo || null, contactoId || null, contactoDireccion || null, contactoCiudad || null, contactoComuna || null, direccionId || null,
        contactosExtra ? JSON.stringify(contactosExtra) : null,
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
    fechaEmision, fechaValidoHasta, condicion, glosa,
    clienteId, clienteRut, clienteRazonSocial,
    clienteDireccion, clienteCiudad, clienteComuna, clienteDireccionId, clienteTelefono, clienteEmail,
    contactoNombre, contactoFono, contactoEmail, contactoCargo, contactoId, contactoDireccion, contactoCiudad, contactoComuna, direccionId, contactosExtra,
    ejecutivo, ejecutivoFono, ejecutivoEmail,
    items, ordenId, ordenNumero
  } = req.body;

  // Cliente es opcional: una cotización "suelta" puede guardarse sin
  // razón social todavía.

  try {
    await pool.query(
      `UPDATE cotizaciones SET fecha_emision = $1, fecha_valido_hasta = $2, condicion = $3, glosa = $4,
        cliente_id = $5, cliente_rut = $6, cliente_razon_social = $7,
        cliente_direccion = $8, cliente_ciudad = $9, cliente_comuna = $10, cliente_direccion_id = $11, cliente_telefono = $12, cliente_email = $13,
        contacto_nombre = $14, contacto_fono = $15, contacto_email = $16, contacto_cargo = $17, contacto_id = $18, contacto_direccion = $19, contacto_ciudad = $20, contacto_comuna = $21, direccion_id = $22, contactos_extra = $23,
        ejecutivo = $24, ejecutivo_fono = $25, ejecutivo_email = $26,
        items = $27, orden_id = $28, orden_numero = $29
       WHERE id = $30`,
      [
        fechaEmision, fechaValidoHasta || null, condicion || null, glosa || null,
        await clienteIdExistente(pool, clienteId), clienteRut || null, clienteRazonSocial || '',
        clienteDireccion || null, clienteCiudad || null, clienteComuna || null, clienteDireccionId || null, clienteTelefono || null, clienteEmail || null,
        contactoNombre || null, contactoFono || null, contactoEmail || null, contactoCargo || null, contactoId || null, contactoDireccion || null, contactoCiudad || null, contactoComuna || null, direccionId || null,
        contactosExtra ? JSON.stringify(contactosExtra) : null,
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
