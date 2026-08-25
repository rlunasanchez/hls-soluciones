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

router.get("/", authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Sin "adjunto": es base64 de hasta ~13MB por orden y el listado nunca lo muestra.
    // Se pide completo en GET /:id al abrir una orden puntual (editarOrden/verOrden).
    const ordenesResult = await pool.query(
      `SELECT id, numero_orden, fecha, es_garantia,
        fecha_ingreso, fecha_ingreso_check, fecha_termino, fecha_termino_check,
        fecha_entrega, fecha_entrega_check, fecha_compra, fecha_compra_check,
        cliente, direccion, comuna, rut, contacto, fono_contacto, email_contacto,
        contactos_extra, direcciones_extra, fono_principal, email, tecnico_asignado, actividad,
        equipo, modelo, marca, serie, contador_pag_out, nivel_tinta,
        insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
        insumo7, insumo8, insumo9, insumo10, insumo11, insumo12,
        averia, observaciones, info_interna,
        cliente_id, equipo_id, fecha_creacion, fecha_actualizacion
       FROM ordenes_trabajo ORDER BY id DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const totalResult = await pool.query("SELECT COUNT(*) as total FROM ordenes_trabajo");
    res.json({ ordenes: ordenesResult.rows, pagination: { currentPage: page, totalPages: Math.ceil(parseInt(totalResult.rows[0].total) / limit), totalItems: parseInt(totalResult.rows[0].total), itemsPerPage: limit } });
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
  const { fecha, esGarantia, fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck, fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck, cliente, direccion, comuna, rut, contacto, fonoContacto, emailContacto, fonoPrincipal, email, tecnicoAsignado, equipo, modelo, marca, serie, contadorPagOut, nivelTinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, actividad, observaciones, infoInterna, adjuntos, contactosExtra, direccionesExtra, clienteId } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const numeroOrden = await calcularSiguienteNumero();
    const existe = await client.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = $1", [numeroOrden]);
    if (existe.rows.length > 0) {
      await client.query("ROLLBACK");
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

await client.query(`INSERT INTO ordenes_trabajo (numero_orden, fecha, es_garantia, fecha_ingreso, fecha_ingreso_check, fecha_termino, fecha_termino_check, fecha_entrega, fecha_entrega_check, fecha_compra, fecha_compra_check, cliente, direccion, comuna, rut, contacto, fono_contacto, email_contacto, fono_principal, email, tecnico_asignado, equipo, modelo, marca, serie, contador_pag_out, nivel_tinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, actividad, observaciones, info_interna, adjunto, contactos_extra, direcciones_extra, cliente_id, equipo_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48)`,
      [numeroOrden, toDateMySQL(fecha), esGarantia || false, toDateMySQL(fechaIngreso), fechaIngresoCheck || false, toDateMySQL(fechaTermino), fechaTerminoCheck || false, toDateMySQL(fechaEntrega), fechaEntregaCheck || false, toDateMySQL(fechaCompra), fechaCompraCheck || false, cliente, direccion || null, comuna || null, rut || null, contacto || null, fonoContacto || null, emailContacto || null, fonoPrincipal || null, email || null, tecnicoAsignado, equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null, actividad || null, observaciones || null, infoInterna || null, adjuntos && adjuntos.length ? JSON.stringify(adjuntos) : null, contactosExtra ? JSON.stringify(contactosExtra) : null, direccionesExtra ? JSON.stringify(direccionesExtra) : null, finalClienteId, finalEquipoId]);

    await client.query("COMMIT");
    res.status(201).json({ msg: "Orden creada", numeroOrden });
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
  const { fecha, esGarantia, fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck, fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck, cliente, direccion, comuna, rut, contacto, fonoContacto, emailContacto, fonoPrincipal, email, tecnicoAsignado, equipo, modelo, marca, serie, contadorPagOut, nivelTinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, actividad, observaciones, infoInterna, adjuntos, contactosExtra, direccionesExtra, clienteId } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // La OT se vincula al cliente SOLO si se seleccionó del buscador (clienteId).
    // Si el cliente se escribió a mano en la OT, los datos quedan solo en la OT
    // (no se crea ni se busca ningún cliente en el mantenedor).
    const finalClienteId = clienteId || null;

    // Las OT NO se vinculan a equipos ni los registran: solo copian los datos
    // (equipo/marca/modelo/serie). El inventario de equipos se gestiona a mano
    // desde el mantenedor de Equipos.
    const finalEquipoId = null;

await client.query(`UPDATE ordenes_trabajo SET fecha = $1, es_garantia = $2, fecha_ingreso = $3, fecha_ingreso_check = $4, fecha_termino = $5, fecha_termino_check = $6, fecha_entrega = $7, fecha_entrega_check = $8, fecha_compra = $9, fecha_compra_check = $10, cliente = $11, direccion = $12, comuna = $13, rut = $14, contacto = $15, fono_contacto = $16, email_contacto = $17, fono_principal = $18, email = $19, tecnico_asignado = $20, equipo = $21, modelo = $22, marca = $23, serie = $24, contador_pag_out = $25, nivel_tinta = $26, insumo1 = $27, insumo2 = $28, insumo3 = $29, insumo4 = $30, insumo5 = $31, insumo6 = $32, insumo7 = $33, insumo8 = $34, insumo9 = $35, insumo10 = $36, insumo11 = $37, insumo12 = $38, averia = $39, actividad = $40, observaciones = $41, info_interna = $42, adjunto = $43, contactos_extra = $44, direcciones_extra = $45, cliente_id = $46, equipo_id = $47 WHERE id = $48`,
      [toDateMySQL(fecha), esGarantia || false, toDateMySQL(fechaIngreso), fechaIngresoCheck || false, toDateMySQL(fechaTermino), fechaTerminoCheck || false, toDateMySQL(fechaEntrega), fechaEntregaCheck || false, toDateMySQL(fechaCompra), fechaCompraCheck || false, cliente, direccion || null, comuna || null, rut || null, contacto || null, fonoContacto || null, emailContacto || null, fonoPrincipal || null, email || null, tecnicoAsignado, equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null, actividad || null, observaciones || null, infoInterna || null, adjuntos && adjuntos.length ? JSON.stringify(adjuntos) : null, contactosExtra ? JSON.stringify(contactosExtra) : null, direccionesExtra ? JSON.stringify(direccionesExtra) : null, finalClienteId, finalEquipoId, id]);

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