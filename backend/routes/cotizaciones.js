import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { armarInsertCotizacion, armarUpdateCotizacion } from "../utils/camposCotizacion.js";
import { calcularMontos } from "../utils/cotizacionTotales.js";
import { filtrosCotizaciones } from "../utils/filtrosCotizaciones.js";
import { leerPaginacion, paginacion, numerarMarcadores } from "../utils/filtrosOrdenes.js";
import { resolverVinculos } from "./ordenesVinculos.js";

const router = express.Router();

async function calcularSiguienteFolio(db) {
  const result = await db.query("SELECT MAX(folio) AS maximo FROM cotizaciones");
  const maximo = result.rows[0]?.maximo || 0;
  return Math.max(maximo + 1, 2800);
}

// Si el cliente de la OT se borró y se registró de nuevo, su id viejo ya no existe y la cotización
// no se podría guardar (clave foránea): en ese caso se guarda sin vínculo al cliente.
async function clienteIdExistente(db, clienteId) {
  if (!clienteId) return null;
  const result = await db.query("SELECT id FROM clientes WHERE id = $1", [clienteId]);
  return result.rows.length > 0 ? clienteId : null;
}

// Datos que se guardan: lo que manda el formulario + los vínculos con el mantenedor (como la OT) + los
// montos, que calcula el servidor a partir de los ítems.
async function datosAGuardar(db, body) {
  const montos = calcularMontos(body.items);
  const vinculos = await resolverVinculos(db, { contacto: body.contacto, direccion: body.direccion });
  return {
    montos,
    datos: {
      ...body,
      clienteId: await clienteIdExistente(db, body.clienteId),
      contactoId: vinculos.contactoId,
      direccionId: vinculos.direccionId,
      neto: montos.neto, iva: montos.iva, total: montos.total, ivaPorcentaje: montos.ivaPorcentaje,
    },
  };
}

// Reemplaza los ítems de la cotización por los que llegan (una fila por ítem, en una sola consulta).
async function guardarItems(db, cotizacionId, items) {
  await db.query("DELETE FROM cotizacion_items WHERE cotizacion_id = $1", [cotizacionId]);
  if (!items.length) return;
  const columnas = 9;
  const marcadores = items.map((_, i) => `(${Array.from({ length: columnas }, (_, c) => `$${i * columnas + c + 1}`).join(", ")})`).join(", ");
  await db.query(
    `INSERT INTO cotizacion_items (cotizacion_id, orden, sku, detalle, descripcion, cantidad, neto, descuento, total) VALUES ${marcadores}`,
    items.flatMap((it, i) => [cotizacionId, i, it.sku || null, it.detalle || null, it.descripcion || null, it.cantidad, it.neto, it.descuento, it.total])
  );
}

// Listado paginado y filtrado en el servidor: ?pagina=&limite=&folio=&cliente=&orden_id= (límite máximo 100).
router.get("/", authMiddleware, async (req, res) => {
  const { pagina, limite, offset } = leerPaginacion(req.query);
  const { where, params } = filtrosCotizaciones(req.query);

  try {
    const cotizaciones = await pool.query(
      numerarMarcadores(`SELECT id, folio, fecha_emision, fecha_valido_hasta, condicion, glosa,
        cliente_id, cliente_tipo, cliente, rut, fono_principal, email,
        contacto_id, contacto, fono_contacto, email_contacto, cargo_contacto,
        direccion_id, direccion, ciudad, comuna,
        ejecutivo, ejecutivo_fono, ejecutivo_email,
        neto, iva_porcentaje, iva, total,
        orden_id, orden_numero, fecha_creacion, fecha_actualizacion
       FROM cotizaciones ${where} ORDER BY id DESC LIMIT ? OFFSET ?`),
      [...params, limite, offset]
    );
    const total = await pool.query(numerarMarcadores(`SELECT COUNT(*) as total FROM cotizaciones ${where}`), params);
    res.json({ cotizaciones: cotizaciones.rows, pagination: paginacion(pagina, limite, parseInt(total.rows[0].total)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cotizaciones WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: "Cotización no encontrada" });
    const items = await pool.query(
      "SELECT sku, detalle, descripcion, cantidad, neto, descuento, total FROM cotizacion_items WHERE cotizacion_id = $1 ORDER BY orden, id",
      [req.params.id]
    );
    res.json({ ...result.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  // Cliente es opcional: una cotización "suelta" (creada sin venir de una OT ni de un Cliente)
  // puede guardarse sin razón social todavía.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const folio = await calcularSiguienteFolio(client);
    // El ejecutivo se toma del usuario autenticado, no de lo que mande el cliente HTTP: es quien está
    // usando la app en ese momento (evita que alguien se atribuya la cotización de otro). Se prioriza el
    // Nombre cargado en Usuarios; si todavía no lo tiene, el usuario de login (nunca queda vacío).
    const { montos, datos } = await datosAGuardar(client, { ...req.body, ejecutivo: req.user.nombre || req.user.usuario });
    const { sql, params } = armarInsertCotizacion(datos, folio);
    const resultado = await client.query(numerarMarcadores(`${sql} RETURNING id`), params);
    const id = resultado.rows[0].id;
    await guardarItems(client, id, montos.items);

    await client.query("COMMIT");
    res.status(201).json({ msg: "Cotización creada", id, folio });
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { montos, datos } = await datosAGuardar(client, req.body);
    const { sql, params } = armarUpdateCotizacion(datos, id);
    await client.query(numerarMarcadores(sql), params);
    await guardarItems(client, id, montos.items);

    await client.query("COMMIT");
    res.json({ msg: "Cotización actualizada" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  } finally {
    client.release();
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    // Los ítems se borran solos (ON DELETE CASCADE)
    await pool.query("DELETE FROM cotizaciones WHERE id = $1", [req.params.id]);
    res.json({ msg: "Cotización eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
