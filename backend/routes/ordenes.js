import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigoEquipo() {
  const result = await pool.query("SELECT MAX(id) as max_id FROM equipos");
  const maxId = result.rows[0].max_id || 0;
  return `EQ-${String(maxId + 1).padStart(4, "0")}`;
}

router.get("/", authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(`
      SELECT * FROM ordenes_trabajo 
      ORDER BY fecha_creacion DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const totalResult = await pool.query("SELECT COUNT(*) as total FROM ordenes_trabajo");
    const total = totalResult.rows[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      ordenes: result.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (err) {
    console.error("Error al obtener órdenes:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/verificar/:numeroOrden", async (req, res) => {
  const { numeroOrden } = req.params;
  const { excluir } = req.query;
  try {
    let query, params;
    if (excluir) {
      query = "SELECT id FROM ordenes_trabajo WHERE numero_orden = $1 AND id != $2";
      params = [numeroOrden, excluir];
    } else {
      query = "SELECT id FROM ordenes_trabajo WHERE numero_orden = $1";
      params = [numeroOrden];
    }
    const result = await pool.query(query, params);
    res.json({ existe: result.rows.length > 0 });
  } catch (err) {
    console.error("Error al verificar número de orden:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM ordenes_trabajo WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: "Orden de trabajo no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error al obtener orden:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const {
    numeroOrden, fecha, esGarantia,
    fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck,
    fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck,
    cliente, direccion, comuna, contacto, fonoPrincipal, tecnicoAsignado,
    equipo, modelo, marca, serie, contadorPagOut, nivelTinta,
    insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
    insumo7, insumo8, insumo9, insumo10, insumo11, insumo12,
    averia, clienteId, equipoId
  } = req.body;

  try {
    const existeResult = await pool.query(
      "SELECT id FROM ordenes_trabajo WHERE numero_orden = $1",
      [numeroOrden]
    );
    
    if (existeResult.rows.length > 0) {
      return res.status(400).json({ msg: "El número de orden ya existe" });
    }

    let finalClienteId = clienteId || null;
    if (!finalClienteId && cliente) {
      const existeClienteResult = await pool.query(
        "SELECT id FROM clientes WHERE razon_social = $1",
        [cliente]
      );
      if (existeClienteResult.rows.length > 0) {
        finalClienteId = existeClienteResult.rows[0].id;
      } else {
        const result = await pool.query(
          `INSERT INTO clientes (razon_social, direccion, comuna, contacto_nombre, telefono)
          VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null]
        );
        finalClienteId = result.rows[0].id;
        await pool.query(
          `INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, comuna, fono)
          VALUES ($1, 'Matriz', $2, $3, $4)`,
          [finalClienteId, direccion || null, comuna || null, fonoPrincipal || null]
        );
      }
    }

    let finalEquipoId = equipoId || null;
    if (!finalEquipoId && equipo && serie) {
      const existeEquipoResult = await pool.query(
        "SELECT id FROM equipos WHERE serie = $1",
        [serie]
      );
      if (existeEquipoResult.rows.length > 0) {
        finalEquipoId = existeEquipoResult.rows[0].id;
      } else {
        const codigo = await generarCodigoEquipo();
        const result = await pool.query(
          `INSERT INTO equipos (codigo, cliente_id, equipo, modelo, marca, serie, contador_pag, nivel_tintas,
            insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
            insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING id`,
          [codigo, finalClienteId, equipo, modelo, marca, serie, contadorPagOut || 0, nivelTinta || null,
            insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null,
            insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null,
            insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null]
        );
        finalEquipoId = result.rows[0].id;
      }
    }

    const sql = `INSERT INTO ordenes_trabajo (
      numero_orden, fecha, es_garantia,
      fecha_ingreso, fecha_ingreso_check, fecha_termino, fecha_termino_check,
      fecha_entrega, fecha_entrega_check, fecha_compra, fecha_compra_check,
      cliente, direccion, comuna, contacto, fono_principal, tecnico_asignado,
      equipo, modelo, marca, serie, contador_pag_out, nivel_tinta,
      insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
      insumo7, insumo8, insumo9, insumo10, insumo11, insumo12,
      averia, cliente_id, equipo_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38)`;

    const values = [
      numeroOrden, fecha, esGarantia || false,
      fechaIngreso || null, fechaIngresoCheck || false, fechaTermino || null, fechaTerminoCheck || false,
      fechaEntrega || null, fechaEntregaCheck || false, fechaCompra || null, fechaCompraCheck || false,
      cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null, tecnicoAsignado,
      equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null,
      insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null,
      insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null,
      averia || null, finalClienteId, finalEquipoId
    ];

    await pool.query(sql, values);
    res.status(201).json({ msg: "Orden de trabajo creada exitosamente" });
  } catch (err) {
    console.error("Error al crear orden:", err);
    res.status(500).json({ msg: "Error del servidor al crear la orden" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    numeroOrden, fecha, esGarantia,
    fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck,
    fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck,
    cliente, direccion, comuna, contacto, fonoPrincipal, tecnicoAsignado,
    equipo, modelo, marca, serie, contadorPagOut, nivelTinta,
    insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
    insumo7, insumo8, insumo9, insumo10, insumo11, insumo12,
    averia, clienteId, equipoId
  } = req.body;

  try {
    const existeResult = await pool.query(
      "SELECT id FROM ordenes_trabajo WHERE numero_orden = $1 AND id != $2",
      [numeroOrden, id]
    );
    
    if (existeResult.rows.length > 0) {
      return res.status(400).json({ msg: "El número de orden ya existe" });
    }

    let finalClienteId = clienteId || null;
    if (!finalClienteId && cliente) {
      const existeClienteResult = await pool.query(
        "SELECT id FROM clientes WHERE razon_social = $1",
        [cliente]
      );
      if (existeClienteResult.rows.length > 0) {
        finalClienteId = existeClienteResult.rows[0].id;
      } else {
        const result = await pool.query(
          `INSERT INTO clientes (razon_social, direccion, comuna, contacto_nombre, telefono)
          VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null]
        );
        finalClienteId = result.rows[0].id;
        await pool.query(
          `INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, comuna, fono)
          VALUES ($1, 'Matriz', $2, $3, $4)`,
          [finalClienteId, direccion || null, comuna || null, fonoPrincipal || null]
        );
      }
    }

    let finalEquipoId = equipoId || null;
    if (!finalEquipoId && equipo && serie) {
      const existeEquipoResult = await pool.query(
        "SELECT id FROM equipos WHERE serie = $1",
        [serie]
      );
      if (existeEquipoResult.rows.length > 0) {
        finalEquipoId = existeEquipoResult.rows[0].id;
      } else {
        const codigo = await generarCodigoEquipo();
        const result = await pool.query(
          `INSERT INTO equipos (codigo, cliente_id, equipo, modelo, marca, serie, contador_pag, nivel_tintas,
            insumo1, insumo2, insumo3, insumo4, insumo5, insumo6,
            insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING id`,
          [codigo, finalClienteId, equipo, modelo, marca, serie, contadorPagOut || 0, nivelTinta || null,
            insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null,
            insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null,
            insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null]
        );
        finalEquipoId = result.rows[0].id;
      }
    }

    const sql = `UPDATE ordenes_trabajo SET
      numero_orden = $1, fecha = $2, es_garantia = $3,
      fecha_ingreso = $4, fecha_ingreso_check = $5, fecha_termino = $6, fecha_termino_check = $7,
      fecha_entrega = $8, fecha_entrega_check = $9, fecha_compra = $10, fecha_compra_check = $11,
      cliente = $12, direccion = $13, comuna = $14, contacto = $15, fono_principal = $16, tecnico_asignado = $17,
      equipo = $18, modelo = $19, marca = $20, serie = $21, contador_pag_out = $22, nivel_tinta = $23,
      insumo1 = $24, insumo2 = $25, insumo3 = $26, insumo4 = $27, insumo5 = $28, insumo6 = $29,
      insumo7 = $30, insumo8 = $31, insumo9 = $32, insumo10 = $33, insumo11 = $34, insumo12 = $35,
      averia = $36, cliente_id = $37, equipo_id = $38
      WHERE id = $39`;

    const values = [
      numeroOrden, fecha, esGarantia || false,
      fechaIngreso || null, fechaIngresoCheck || false, fechaTermino || null, fechaTerminoCheck || false,
      fechaEntrega || null, fechaEntregaCheck || false, fechaCompra || null, fechaCompraCheck || false,
      cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null, tecnicoAsignado,
      equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null,
      insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null,
      insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null,
      averia || null, finalClienteId, finalEquipoId, id
    ];

    await pool.query(sql, values);
    res.json({ msg: "Orden de trabajo actualizada exitosamente" });
  } catch (err) {
    console.error("Error al actualizar orden:", err);
    res.status(500).json({ msg: "Error del servidor al actualizar la orden" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM ordenes_trabajo WHERE id = $1", [id]);
    res.json({ msg: "Orden de trabajo eliminada exitosamente" });
  } catch (err) {
    console.error("Error al eliminar orden:", err);
    res.status(500).json({ msg: "Error del servidor al eliminar la orden" });
  }
});

export default router;
