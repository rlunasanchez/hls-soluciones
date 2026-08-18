import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

const toDateMySQL = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

router.get("/", authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [ordenes] = await pool.query("SELECT * FROM ordenes_trabajo ORDER BY id DESC LIMIT ? OFFSET ?", [limit, offset]);
    const [totalResult] = await pool.query("SELECT COUNT(*) as total FROM ordenes_trabajo");
    res.json({ ordenes, pagination: { currentPage: page, totalPages: Math.ceil(parseInt(totalResult[0].total) / limit), totalItems: parseInt(totalResult[0].total), itemsPerPage: limit } });
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
  const { fecha, esGarantia, fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck, fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck, cliente, direccion, comuna, rut, contacto, fonoContacto, emailContacto, fonoPrincipal, email, tecnicoAsignado, equipo, modelo, marca, serie, contadorPagOut, nivelTinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, actividad, observaciones, contactosExtra, direccionesExtra, clienteId } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const numeroOrden = await calcularSiguienteNumero();
    const [existe] = await connection.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = ?", [numeroOrden]);
    if (existe.length > 0) {
      await connection.rollback();
      return res.status(400).json({ msg: "El número de orden ya existe" });
    }

    // La OT se vincula al cliente SOLO si se seleccionó del buscador (clienteId).
    // Si el cliente se escribió a mano en la OT, los datos quedan solo en la OT
    // (no se crea ni se busca ningún cliente en el mantenedor).
    const finalClienteId = clienteId || null;

    // Las OT NO se vinculan a equipos ni los registran: solo copian los datos
    // (equipo/marca/modelo/serie). El inventario de equipos se gestiona a mano
    // desde el mantenedor de Equipos.
    const finalEquipoId = null;

    await connection.query(`INSERT INTO ordenes_trabajo (numero_orden, fecha, es_garantia, fecha_ingreso, fecha_ingreso_check, fecha_termino, fecha_termino_check, fecha_entrega, fecha_entrega_check, fecha_compra, fecha_compra_check, cliente, direccion, comuna, rut, contacto, fono_contacto, email_contacto, fono_principal, email, tecnico_asignado, equipo, modelo, marca, serie, contador_pag_out, nivel_tinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, actividad, observaciones, contactos_extra, direcciones_extra, cliente_id, equipo_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numeroOrden, toDateMySQL(fecha), esGarantia || false, toDateMySQL(fechaIngreso), fechaIngresoCheck || false, toDateMySQL(fechaTermino), fechaTerminoCheck || false, toDateMySQL(fechaEntrega), fechaEntregaCheck || false, toDateMySQL(fechaCompra), fechaCompraCheck || false, cliente, direccion || null, comuna || null, rut || null, contacto || null, fonoContacto || null, emailContacto || null, fonoPrincipal || null, email || null, tecnicoAsignado, equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null, actividad || null, observaciones || null, contactosExtra ? JSON.stringify(contactosExtra) : null, direccionesExtra ? JSON.stringify(direccionesExtra) : null, finalClienteId, finalEquipoId]);

    await connection.commit();
    res.status(201).json({ msg: "Orden creada" });
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
  const { fecha, esGarantia, fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck, fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck, cliente, direccion, comuna, rut, contacto, fonoContacto, emailContacto, fonoPrincipal, email, tecnicoAsignado, equipo, modelo, marca, serie, contadorPagOut, nivelTinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, actividad, observaciones, contactosExtra, direccionesExtra, clienteId } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // La OT se vincula al cliente SOLO si se seleccionó del buscador (clienteId).
    // Si el cliente se escribió a mano en la OT, los datos quedan solo en la OT
    // (no se crea ni se busca ningún cliente en el mantenedor).
    const finalClienteId = clienteId || null;

    // Las OT NO se vinculan a equipos ni los registran: solo copian los datos
    // (equipo/marca/modelo/serie). El inventario de equipos se gestiona a mano
    // desde el mantenedor de Equipos.
    const finalEquipoId = null;

    await connection.query(`UPDATE ordenes_trabajo SET fecha = ?, es_garantia = ?, fecha_ingreso = ?, fecha_ingreso_check = ?, fecha_termino = ?, fecha_termino_check = ?, fecha_entrega = ?, fecha_entrega_check = ?, fecha_compra = ?, fecha_compra_check = ?, cliente = ?, direccion = ?, comuna = ?, rut = ?, contacto = ?, fono_contacto = ?, email_contacto = ?, fono_principal = ?, email = ?, tecnico_asignado = ?, equipo = ?, modelo = ?, marca = ?, serie = ?, contador_pag_out = ?, nivel_tinta = ?, insumo1 = ?, insumo2 = ?, insumo3 = ?, insumo4 = ?, insumo5 = ?, insumo6 = ?, insumo7 = ?, insumo8 = ?, insumo9 = ?, insumo10 = ?, insumo11 = ?, insumo12 = ?, averia = ?, actividad = ?, observaciones = ?, contactos_extra = ?, direcciones_extra = ?, cliente_id = ?, equipo_id = ? WHERE id = ?`,
      [toDateMySQL(fecha), esGarantia || false, toDateMySQL(fechaIngreso), fechaIngresoCheck || false, toDateMySQL(fechaTermino), fechaTerminoCheck || false, toDateMySQL(fechaEntrega), fechaEntregaCheck || false, toDateMySQL(fechaCompra), fechaCompraCheck || false, cliente, direccion || null, comuna || null, rut || null, contacto || null, fonoContacto || null, emailContacto || null, fonoPrincipal || null, email || null, tecnicoAsignado, equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null, actividad || null, observaciones || null, contactosExtra ? JSON.stringify(contactosExtra) : null, direccionesExtra ? JSON.stringify(direccionesExtra) : null, finalClienteId, finalEquipoId, id]);

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
