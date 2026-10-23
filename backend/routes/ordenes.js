import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { filtrosOrdenes, leerPaginacion } from "../utils/filtrosOrdenes.js";
import { armarInsertOrden, armarUpdateOrden } from "../utils/camposOrden.js";
import { resolverVinculos } from "./ordenesVinculos.js";

dotenv.config();
const router = express.Router();

// Listado paginado y filtrado en el servidor: ?pagina=&limite=&numero=&cliente=&serie=&estado=&garantia=&desde=&hasta=
router.get("/", authMiddleware, async (req, res) => {
  const { pagina, limite, offset } = leerPaginacion(req.query);
  const { where, params } = filtrosOrdenes(req.query);

  try {
    // Sin "adjunto": es base64 de hasta ~13MB por orden y el listado nunca lo muestra.
    // Se pide completo en GET /:id al abrir una orden puntual (editarOrden/verOrden).
    const [ordenes] = await pool.query(
      `SELECT id, numero_orden, fecha, es_garantia,
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
       FROM ordenes_trabajo ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limite, offset]
    );
    const [totalResult] = await pool.query(`SELECT COUNT(*) as total FROM ordenes_trabajo ${where}`, params);
    const total = parseInt(totalResult[0].total);
    res.json({ ordenes, pagination: { currentPage: pagina, totalPages: Math.ceil(total / limite), totalItems: total, itemsPerPage: limite } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

async function calcularSiguienteNumero() {
  const year = new Date().getFullYear();
  const [rows] = await pool.query("SELECT numero_orden FROM ordenes_trabajo WHERE numero_orden LIKE ? ORDER BY numero_orden DESC LIMIT 1", [`OT-${year}-%`]);
  let siguiente = 2800;
  if (rows.length > 0) {
    const partes = rows[0].numero_orden.split("-");
    if (partes.length === 3) siguiente = Math.max(parseInt(partes[2], 10) + 1, 2800);
  }
  return `OT-${year}-${String(siguiente).padStart(5, "0")}`;
}

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
    const [rows] = await pool.query("SELECT * FROM ordenes_trabajo WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Orden no encontrada" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const numeroOrden = await calcularSiguienteNumero();
    const [existe] = await connection.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = ?", [numeroOrden]);
    if (existe.length > 0) {
      await connection.rollback();
      return res.status(400).json({ msg: "El número de orden ya existe" });
    }

    const { sql, params } = armarInsertOrden({ ...req.body, ...(await resolverVinculos(connection, req.body)) }, numeroOrden);
    const [resultado] = await connection.query(sql, params);

    await connection.commit();
    res.status(201).json({ msg: "Orden creada", id: resultado.insertId, numeroOrden });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  } finally {
    connection.release();
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { sql, params } = armarUpdateOrden({ ...req.body, ...(await resolverVinculos(connection, req.body)) }, id);
    await connection.query(sql, params);

    await connection.commit();
    res.json({ msg: "Orden actualizada" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  } finally {
    connection.release();
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM ordenes_trabajo WHERE id = ?", [req.params.id]);
    res.json({ msg: "Orden eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
