import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

// Obtener todas las órdenes de trabajo
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [ordenes] = await pool.query(`
      SELECT * FROM ordenes_trabajo 
      ORDER BY fecha_creacion DESC
    `);
    res.json(ordenes);
  } catch (err) {
    console.error("Error al obtener órdenes:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Verificar si un número de orden ya existe
router.get("/verificar/:numeroOrden", async (req, res) => {
  const { numeroOrden } = req.params;
  try {
    const [result] = await pool.query(
      "SELECT id FROM ordenes_trabajo WHERE numero_orden = ?",
      [numeroOrden]
    );
    res.json({ existe: result.length > 0 });
  } catch (err) {
    console.error("Error al verificar número de orden:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Obtener una orden de trabajo por ID
router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [ordenes] = await pool.query(
      "SELECT * FROM ordenes_trabajo WHERE id = ?",
      [id]
    );
    if (ordenes.length === 0) {
      return res.status(404).json({ msg: "Orden de trabajo no encontrada" });
    }
    res.json(ordenes[0]);
  } catch (err) {
    console.error("Error al obtener orden:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Crear nueva orden de trabajo
router.post("/", authMiddleware, async (req, res) => {
  const {
    numeroOrden, fecha, esGarantia,
    fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck,
    fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck,
    cliente, direccion, comuna, contacto, fonoPrincipal, tecnicoAsignado, actividad,
    equipo, modelo, marca, serie, contadorPagOut, nivelTinta,
    insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
    insumo7, insumo8, insumo9, insumo10, insumo11, insumo12,
    averia, clienteId, equipoId
  } = req.body;

  try {
    // Verificar si el número de orden ya existe
    const [existe] = await pool.query(
      "SELECT id FROM ordenes_trabajo WHERE numero_orden = ?",
      [numeroOrden]
    );
    
    if (existe.length > 0) {
      return res.status(400).json({ msg: "El número de orden ya existe" });
    }

    const sql = `
      INSERT INTO ordenes_trabajo (
        numero_orden, fecha, es_garantia,
        fecha_ingreso, fecha_ingreso_check, fecha_termino, fecha_termino_check,
        fecha_entrega, fecha_entrega_check, fecha_compra, fecha_compra_check,
        cliente, direccion, comuna, contacto, fono_principal, tecnico_asignado, actividad,
        equipo, modelo, marca, serie, contador_pag_out, nivel_tinta,
        insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
        insumo7, insumo8, insumo9, insumo10, insumo11, insumo12,
        averia, cliente_id, equipo_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      numeroOrden, fecha, esGarantia || false,
      fechaIngreso || null, fechaIngresoCheck || false, fechaTermino || null, fechaTerminoCheck || false,
      fechaEntrega || null, fechaEntregaCheck || false, fechaCompra || null, fechaCompraCheck || false,
      cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null, tecnicoAsignado, actividad || null,
      equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null,
      insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null,
      insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null,
      averia || null, clienteId || null, equipoId || null
    ];

    await pool.query(sql, values);
    res.status(201).json({ msg: "Orden de trabajo creada exitosamente" });
  } catch (err) {
    console.error("Error al crear orden:", err);
    res.status(500).json({ msg: "Error del servidor al crear la orden" });
  }
});

// Actualizar orden de trabajo
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    numeroOrden, fecha, esGarantia,
    fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck,
    fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck,
    cliente, direccion, comuna, contacto, fonoPrincipal, tecnicoAsignado, actividad,
    equipo, modelo, marca, serie, contadorPagOut, nivelTinta,
    insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
    insumo7, insumo8, insumo9, insumo10, insumo11, insumo12,
    averia, clienteId, equipoId
  } = req.body;

  try {
    // Verificar si existe otra orden con el mismo número
    const [existe] = await pool.query(
      "SELECT id FROM ordenes_trabajo WHERE numero_orden = ? AND id != ?",
      [numeroOrden, id]
    );
    
    if (existe.length > 0) {
      return res.status(400).json({ msg: "El número de orden ya existe" });
    }

    const sql = `
      UPDATE ordenes_trabajo SET
        numero_orden = ?, fecha = ?, es_garantia = ?,
        fecha_ingreso = ?, fecha_ingreso_check = ?, fecha_termino = ?, fecha_termino_check = ?,
        fecha_entrega = ?, fecha_entrega_check = ?, fecha_compra = ?, fecha_compra_check = ?,
        cliente = ?, direccion = ?, comuna = ?, contacto = ?, fono_principal = ?, tecnico_asignado = ?, actividad = ?,
        equipo = ?, modelo = ?, marca = ?, serie = ?, contador_pag_out = ?, nivel_tinta = ?,
        insumo1 = ?, insumo2 = ?, insumo3 = ?, insumo4 = ?, insumo5 = ?, insumo6 = ?,
        insumo7 = ?, insumo8 = ?, insumo9 = ?, insumo10 = ?, insumo11 = ?, insumo12 = ?,
        averia = ?, cliente_id = ?, equipo_id = ?
      WHERE id = ?
    `;

    const values = [
      numeroOrden, fecha, esGarantia || false,
      fechaIngreso || null, fechaIngresoCheck || false, fechaTermino || null, fechaTerminoCheck || false,
      fechaEntrega || null, fechaEntregaCheck || false, fechaCompra || null, fechaCompraCheck || false,
      cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null, tecnicoAsignado, actividad || null,
      equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null,
      insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null,
      insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null,
      averia || null, clienteId || null, equipoId || null, id
    ];

    await pool.query(sql, values);
    res.json({ msg: "Orden de trabajo actualizada exitosamente" });
  } catch (err) {
    console.error("Error al actualizar orden:", err);
    res.status(500).json({ msg: "Error del servidor al actualizar la orden" });
  }
});

// Eliminar orden de trabajo
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM ordenes_trabajo WHERE id = ?", [id]);
    res.json({ msg: "Orden de trabajo eliminada exitosamente" });
  } catch (err) {
    console.error("Error al eliminar orden:", err);
    res.status(500).json({ msg: "Error del servidor al eliminar la orden" });
  }
});

export default router;