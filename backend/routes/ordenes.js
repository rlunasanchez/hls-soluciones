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

async function generarCodigoEquipo() {
  const result = await pool.query("SELECT codigo FROM equipos WHERE codigo LIKE 'EQ-%' ORDER BY id DESC LIMIT 1");
  if (result.rows.length === 0) return "EQ-0001";
  const num = parseInt(result.rows[0].codigo.split("-")[1], 10) || 0;
  return `EQ-${String(num + 1).padStart(4, "0")}`;
}

router.get("/", authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const ordenes = await pool.query("SELECT * FROM ordenes_trabajo ORDER BY id DESC LIMIT $1 OFFSET $2", [limit, offset]);
    const totalResult = await pool.query("SELECT COUNT(*) as total FROM ordenes_trabajo");
    res.json({ ordenes: ordenes.rows, pagination: { currentPage: page, totalPages: Math.ceil(parseInt(totalResult.rows[0].total) / limit), totalItems: parseInt(totalResult.rows[0].total), itemsPerPage: limit } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/siguiente-numero", async (req, res) => {
  const year = new Date().getFullYear();
  try {
    const result = await pool.query("SELECT numero_orden FROM ordenes_trabajo WHERE numero_orden LIKE $1 ORDER BY numero_orden DESC LIMIT 1", [`OT-${year}-%`]);
    let siguiente = 1;
    if (result.rows.length > 0) {
      const partes = result.rows[0].numero_orden.split("-");
      if (partes.length === 3) siguiente = parseInt(partes[2], 10) + 1;
    }
    res.json({ numeroOrden: `OT-${year}-${String(siguiente).padStart(4, "0")}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/verificar/:numeroOrden", async (req, res) => {
  const { numeroOrden } = req.params;
  const { excluir } = req.query;
  try {
    const result = excluir
      ? await pool.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = $1 AND id != $2", [numeroOrden, excluir])
      : await pool.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = $1", [numeroOrden]);
    res.json({ existe: result.rows.length > 0 });
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
  const { numeroOrden, fecha, esGarantia, fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck, fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck, cliente, direccion, comuna, contacto, fonoPrincipal, tecnicoAsignado, equipo, modelo, marca, serie, contadorPagOut, nivelTinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, clienteId, equipoId } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existe = await client.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = $1", [numeroOrden]);
    if (existe.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "El n├║mero de orden ya existe" });
    }

    let finalClienteId = clienteId || null;
    if (!finalClienteId && cliente) {
      const existeCliente = await client.query("SELECT id FROM clientes WHERE razon_social = $1", [cliente]);
      if (existeCliente.rows.length > 0) {
        finalClienteId = existeCliente.rows[0].id;
      } else {
        const result = await client.query("INSERT INTO clientes (razon_social, direccion, comuna, contacto_nombre, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING id", [cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null]);
        finalClienteId = result.rows[0].id;
        await client.query("INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, comuna, fono) VALUES ($1, 'Matriz', $2, $3, $4)", [finalClienteId, direccion || null, comuna || null, fonoPrincipal || null]);
      }
    }

    let finalEquipoId = equipoId || null;
    if (!finalEquipoId && equipo && serie) {
      const existeEquipo = await client.query("SELECT id FROM equipos WHERE serie = $1", [serie]);
      if (existeEquipo.rows.length > 0) {
        finalEquipoId = existeEquipo.rows[0].id;
      } else {
        const codigo = await generarCodigoEquipo();
        const result = await client.query(`INSERT INTO equipos (codigo, cliente_id, equipo, modelo, marca, serie, contador_pag, nivel_tintas, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING id`,
          [codigo, finalClienteId, equipo, modelo, marca, serie, contadorPagOut || 0, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null]);
        finalEquipoId = result.rows[0].id;
      }
    }

    await client.query(`INSERT INTO ordenes_trabajo (numero_orden, fecha, es_garantia, fecha_ingreso, fecha_ingreso_check, fecha_termino, fecha_termino_check, fecha_entrega, fecha_entrega_check, fecha_compra, fecha_compra_check, cliente, direccion, comuna, contacto, fono_principal, tecnico_asignado, equipo, modelo, marca, serie, contador_pag_out, nivel_tinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, cliente_id, equipo_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38)`,
      [numeroOrden, toDateMySQL(fecha), esGarantia || false, toDateMySQL(fechaIngreso), fechaIngresoCheck || false, toDateMySQL(fechaTermino), fechaTerminoCheck || false, toDateMySQL(fechaEntrega), fechaEntregaCheck || false, toDateMySQL(fechaCompra), fechaCompraCheck || false, cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null, tecnicoAsignado, equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null, finalClienteId, actividad || null, observaciones || null, finalEquipoId]);

    await client.query("COMMIT");
    res.status(201).json({ msg: "Orden creada" });
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
  const { numeroOrden, fecha, esGarantia, fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck, fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck, cliente, direccion, comuna, contacto, fonoPrincipal, tecnicoAsignado, equipo, modelo, marca, serie, contadorPagOut, nivelTinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, clienteId, equipoId } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existe = await client.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = $1 AND id != $2", [numeroOrden, id]);
    if (existe.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ msg: "El n├║mero de orden ya existe" });
    }

    let finalClienteId = clienteId || null;
    if (!finalClienteId && cliente) {
      const existeCliente = await client.query("SELECT id FROM clientes WHERE razon_social = $1", [cliente]);
      if (existeCliente.rows.length > 0) {
        finalClienteId = existeCliente.rows[0].id;
      } else {
        const result = await client.query("INSERT INTO clientes (razon_social, direccion, comuna, contacto_nombre, telefono) VALUES ($1, $2, $3, $4, $5) RETURNING id", [cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null]);
        finalClienteId = result.rows[0].id;
        await client.query("INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, comuna, fono) VALUES ($1, 'Matriz', $2, $3, $4)", [finalClienteId, direccion || null, comuna || null, fonoPrincipal || null]);
      }
    }

    let finalEquipoId = equipoId || null;
    if (!finalEquipoId && equipo && serie) {
      const existeEquipo = await client.query("SELECT id FROM equipos WHERE serie = $1", [serie]);
      if (existeEquipo.rows.length > 0) {
        finalEquipoId = existeEquipo.rows[0].id;
      } else {
        const codigo = await generarCodigoEquipo();
        const result = await client.query(`INSERT INTO equipos (codigo, cliente_id, equipo, modelo, marca, serie, contador_pag, nivel_tintas, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING id`,
          [codigo, finalClienteId, equipo, modelo, marca, serie, contadorPagOut || 0, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null]);
        finalEquipoId = result.rows[0].id;
      }
    }

    await client.query(`UPDATE ordenes_trabajo SET numero_orden = $1, fecha = $2, es_garantia = $3, fecha_ingreso = $4, fecha_ingreso_check = $5, fecha_termino = $6, fecha_termino_check = $7, fecha_entrega = $8, fecha_entrega_check = $9, fecha_compra = $10, fecha_compra_check = $11, cliente = $12, direccion = $13, comuna = $14, contacto = $15, fono_principal = $16, tecnico_asignado = $17, equipo = $18, modelo = $19, marca = $20, serie = $21, contador_pag_out = $22, nivel_tinta = $23, insumo1 = $24, insumo2 = $25, insumo3 = $26, insumo4 = $27, insumo5 = $28, insumo6 = $29, insumo7 = $30, insumo8 = $31, insumo9 = $32, insumo10 = $33, insumo11 = $34, insumo12 = $35, averia = $36, cliente_id = $37, equipo_id = $38 WHERE id = $39`,
      [numeroOrden, toDateMySQL(fecha), esGarantia || false, toDateMySQL(fechaIngreso), fechaIngresoCheck || false, toDateMySQL(fechaTermino), fechaTerminoCheck || false, toDateMySQL(fechaEntrega), fechaEntregaCheck || false, toDateMySQL(fechaCompra), fechaCompraCheck || false, cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null, tecnicoAsignado, equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null, finalClienteId, finalEquipoId, id]);

    // Al editar desde OT, actualizar tambi├®n el registro maestro del equipo
    if (finalEquipoId) {
      await client.query(
        `UPDATE equipos SET equipo = $1, modelo = $2, marca = $3, serie = $4,
          contador_pag = $5, nivel_tintas = $6,
          insumo1 = $7, insumo2 = $8, insumo3 = $9, insumo4 = $10, insumo5 = $11, insumo6 = $12,
          insumo7 = $13, insumo8 = $14, insumo9 = $15, insumo10 = $16, insumo11 = $17, insumo12 = $18,
          averia = $19, actividad = $20, observaciones = $21 WHERE id = $22`,
        [equipo, modelo, marca, serie || null, contadorPagOut || 0, nivelTinta || null,
          insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null,
          insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null,
          insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null,
          actividad || null, observaciones || null, finalEquipoId]
      );
    }

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
