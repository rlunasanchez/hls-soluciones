import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { filtrosOrdenes, leerPaginacion, numerarMarcadores } from "../utils/filtrosOrdenes.js";
import { armarInsertOrden, armarUpdateOrden } from "../utils/camposOrden.js";
import { resolverVinculos } from "./ordenesVinculos.js";

dotenv.config();
const router = express.Router();

async function calcularSiguienteNumero() {
  const year = new Date().getFullYear();
  const result = await pool.query("SELECT numero_orden FROM ordenes_trabajo WHERE numero_orden LIKE $1 ORDER BY numero_orden DESC LIMIT 1", [`OT-${year}-%`]);
  let siguiente = 2800;
  if (result.rows.length > 0) {
    const partes = result.rows[0].numero_orden.split("-");
    if (partes.length === 3) siguiente = Math.max(parseInt(partes[2], 10) + 1, 2800);
  }
  return `OT-${year}-${String(siguiente).padStart(5, "0")}`;
}

// Listado paginado y filtrado en el servidor: ?pagina=&limite=&numero=&cliente=&serie=&estado=&garantia=&desde=&hasta=
router.get("/", authMiddleware, async (req, res) => {
  const { pagina, limite, offset } = leerPaginacion(req.query);
  const { where, params } = filtrosOrdenes(req.query);

  try {
    // Sin "adjunto": es base64 de hasta ~13MB por orden y el listado nunca lo muestra.
    // Se pide completo en GET /:id al abrir una orden puntual (editarOrden/verOrden).
    const ordenesResult = await pool.query(
      numerarMarcadores(`SELECT id, numero_orden, fecha, es_garantia,
        fecha_ingreso, fecha_ingreso_check, fecha_termino, fecha_termino_check,
        fecha_entrega, fecha_entrega_check, fecha_compra, fecha_compra_check,
        cliente, direccion, ciudad, comuna, rut, contacto, fono_contacto, email_contacto, cargo_contacto,
        contactos_extra, direcciones_extra, fono_principal, email, tecnico_asignado, actividad,
        equipo, modelo, marca, serie, contador_pag_out, nivel_tinta,
        insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
        insumo7, insumo8, insumo9, insumo10, insumo11, insumo12,
        averia, observaciones, info_interna,
        cliente_id, cliente_tipo, fecha_creacion, fecha_actualizacion,
        (SELECT COUNT(*) FROM cotizaciones c WHERE c.orden_id = ordenes_trabajo.id) AS cotizaciones_count
       FROM ordenes_trabajo ${where} ORDER BY id DESC LIMIT ? OFFSET ?`),
      [...params, limite, offset]
    );
    const totalResult = await pool.query(numerarMarcadores(`SELECT COUNT(*) as total FROM ordenes_trabajo ${where}`), params);
    const total = parseInt(totalResult.rows[0].total);
    res.json({ ordenes: ordenesResult.rows, pagination: { currentPage: pagina, totalPages: Math.ceil(total / limite), totalItems: total, itemsPerPage: limite } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/siguiente-numero", authMiddleware, async (req, res) => {
  try {
    res.json({ numeroOrden: await calcularSiguienteNumero() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ordenes_trabajo WHERE id = $1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: "Orden no encontrada" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const numeroOrden = await calcularSiguienteNumero();
    const existe = await client.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = $1", [numeroOrden]);
    if (existe.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "El número de orden ya existe" });
    }

    const { sql, params } = armarInsertOrden({ ...req.body, ...(await resolverVinculos(client, req.body)) }, numeroOrden);
    const resultado = await client.query(numerarMarcadores(`${sql} RETURNING id`), params);

    await client.query("COMMIT");
    res.status(201).json({ msg: "Orden creada", id: resultado.rows[0].id, numeroOrden });
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

    const { sql, params } = armarUpdateOrden({ ...req.body, ...(await resolverVinculos(client, req.body)) }, id);
    await client.query(numerarMarcadores(sql), params);

    await client.query("COMMIT");
    res.json({ msg: "Orden actualizada" });
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
    await pool.query("DELETE FROM ordenes_trabajo WHERE id = $1", [req.params.id]);
    res.json({ msg: "Orden eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;