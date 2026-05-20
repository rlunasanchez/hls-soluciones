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
  const [rows] = await pool.query("SELECT codigo FROM equipos WHERE codigo LIKE 'EQ-%' ORDER BY id DESC LIMIT 1");
  if (rows.length === 0) return "EQ-0001";
  const num = parseInt(rows[0].codigo.split("-")[1], 10) || 0;
  return `EQ-${String(num + 1).padStart(4, "0")}`;
}

router.get("/", authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [ordenes] = await pool.query("SELECT * FROM ordenes_trabajo ORDER BY id DESC LIMIT ? OFFSET ?", [limit, offset]);
    const [totalResult] = await pool.query("SELECT COUNT(*) as total FROM ordenes_trabajo");
    res.json({ ordenes, pagination: { currentPage: page, totalPages: Math.ceil(totalResult[0].total / limit), totalItems: totalResult[0].total, itemsPerPage: limit } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/siguiente-numero", async (req, res) => {
  const year = new Date().getFullYear();
  try {
    const [rows] = await pool.query("SELECT numero_orden FROM ordenes_trabajo WHERE numero_orden LIKE ? ORDER BY numero_orden DESC LIMIT 1", [`OT-${year}-%`]);
    let siguiente = 1;
    if (rows.length > 0) {
      const partes = rows[0].numero_orden.split("-");
      if (partes.length === 3) siguiente = parseInt(partes[2], 10) + 1;
    }
    res.json({ numeroOrden: `OT-${year}-${String(siguiente).padStart(4, "0")}` });
  } catch (err) {
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/verificar/:numeroOrden", async (req, res) => {
  const { numeroOrden } = req.params;
  const { excluir } = req.query;
  try {
    const [result] = excluir 
      ? await pool.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = ? AND id != ?", [numeroOrden, excluir])
      : await pool.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = ?", [numeroOrden]);
    res.json({ existe: result.length > 0 });
  } catch (err) {
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const [ordenes] = await pool.query("SELECT * FROM ordenes_trabajo WHERE id = ?", [req.params.id]);
    if (ordenes.length === 0) return res.status(404).json({ msg: "Orden no encontrada" });
    res.json(ordenes[0]);
  } catch (err) {
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { numeroOrden, fecha, esGarantia, fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck, fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck, cliente, direccion, comuna, contacto, fonoPrincipal, tecnicoAsignado, equipo, modelo, marca, serie, contadorPagOut, nivelTinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, clienteId, equipoId } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existe] = await connection.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = ?", [numeroOrden]);
    if (existe.length > 0) {
      await connection.rollback();
      return res.status(400).json({ msg: "El número de orden ya existe" });
    }

    let finalClienteId = clienteId || null;
    if (!finalClienteId && cliente) {
      const [existeCliente] = await connection.query("SELECT id FROM clientes WHERE razon_social = ?", [cliente]);
      if (existeCliente.length > 0) {
        finalClienteId = existeCliente[0].id;
      } else {
        const [result] = await connection.query("INSERT INTO clientes (razon_social, direccion, comuna, contacto_nombre, telefono) VALUES (?, ?, ?, ?, ?)", [cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null]);
        finalClienteId = result.insertId;
        await connection.query("INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, comuna, fono) VALUES (?, 'Matriz', ?, ?, ?)", [finalClienteId, direccion || null, comuna || null, fonoPrincipal || null]);
      }
    }

    let finalEquipoId = equipoId || null;
    if (!finalEquipoId && equipo && serie) {
      const [existeEquipo] = await connection.query("SELECT id FROM equipos WHERE serie = ?", [serie]);
      if (existeEquipo.length > 0) {
        finalEquipoId = existeEquipo[0].id;
      } else {
        const codigo = await generarCodigoEquipo();
        const [result] = await connection.query("INSERT INTO equipos (codigo, cliente_id, equipo, modelo, marca, serie, contador_pag, nivel_tintas, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [codigo, finalClienteId, equipo, modelo, marca, serie, contadorPagOut || 0, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null]);
        finalEquipoId = result.insertId;
      }
    }

    await connection.query(`INSERT INTO ordenes_trabajo (numero_orden, fecha, es_garantia, fecha_ingreso, fecha_ingreso_check, fecha_termino, fecha_termino_check, fecha_entrega, fecha_entrega_check, fecha_compra, fecha_compra_check, cliente, direccion, comuna, contacto, fono_principal, tecnico_asignado, equipo, modelo, marca, serie, contador_pag_out, nivel_tinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, cliente_id, equipo_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [numeroOrden, toDateMySQL(fecha), esGarantia || false, toDateMySQL(fechaIngreso), fechaIngresoCheck || false, toDateMySQL(fechaTermino), fechaTerminoCheck || false, toDateMySQL(fechaEntrega), fechaEntregaCheck || false, toDateMySQL(fechaCompra), fechaCompraCheck || false, cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null, tecnicoAsignado, equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null, finalClienteId, finalEquipoId]);

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
  const { numeroOrden, fecha, esGarantia, fechaIngreso, fechaIngresoCheck, fechaTermino, fechaTerminoCheck, fechaEntrega, fechaEntregaCheck, fechaCompra, fechaCompraCheck, cliente, direccion, comuna, contacto, fonoPrincipal, tecnicoAsignado, equipo, modelo, marca, serie, contadorPagOut, nivelTinta, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia, clienteId, equipoId } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existe] = await connection.query("SELECT id FROM ordenes_trabajo WHERE numero_orden = ? AND id != ?", [numeroOrden, id]);
    if (existe.length > 0) {
      await connection.rollback();
      return res.status(400).json({ msg: "El número de orden ya existe" });
    }

    let finalClienteId = clienteId || null;
    if (!finalClienteId && cliente) {
      const [existeCliente] = await connection.query("SELECT id FROM clientes WHERE razon_social = ?", [cliente]);
      if (existeCliente.length > 0) {
        finalClienteId = existeCliente[0].id;
      } else {
        const [result] = await connection.query("INSERT INTO clientes (razon_social, direccion, comuna, contacto_nombre, telefono) VALUES (?, ?, ?, ?, ?)", [cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null]);
        finalClienteId = result.insertId;
        await connection.query("INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, comuna, fono) VALUES (?, 'Matriz', ?, ?, ?)", [finalClienteId, direccion || null, comuna || null, fonoPrincipal || null]);
      }
    }

    let finalEquipoId = equipoId || null;
    if (!finalEquipoId && equipo && serie) {
      const [existeEquipo] = await connection.query("SELECT id FROM equipos WHERE serie = ?", [serie]);
      if (existeEquipo.length > 0) {
        finalEquipoId = existeEquipo[0].id;
      } else {
        const codigo = await generarCodigoEquipo();
        const [result] = await connection.query("INSERT INTO equipos (codigo, cliente_id, equipo, modelo, marca, serie, contador_pag, nivel_tintas, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [codigo, finalClienteId, equipo, modelo, marca, serie, contadorPagOut || 0, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null]);
        finalEquipoId = result.insertId;
      }
    }

    await connection.query(`UPDATE ordenes_trabajo SET numero_orden = ?, fecha = ?, es_garantia = ?, fecha_ingreso = ?, fecha_ingreso_check = ?, fecha_termino = ?, fecha_termino_check = ?, fecha_entrega = ?, fecha_entrega_check = ?, fecha_compra = ?, fecha_compra_check = ?, cliente = ?, direccion = ?, comuna = ?, contacto = ?, fono_principal = ?, tecnico_asignado = ?, equipo = ?, modelo = ?, marca = ?, serie = ?, contador_pag_out = ?, nivel_tinta = ?, insumo1 = ?, insumo2 = ?, insumo3 = ?, insumo4 = ?, insumo5 = ?, insumo6 = ?, insumo7 = ?, insumo8 = ?, insumo9 = ?, insumo10 = ?, insumo11 = ?, insumo12 = ?, averia = ?, cliente_id = ?, equipo_id = ? WHERE id = ?`,
      [numeroOrden, toDateMySQL(fecha), esGarantia || false, toDateMySQL(fechaIngreso), fechaIngresoCheck || false, toDateMySQL(fechaTermino), fechaTerminoCheck || false, toDateMySQL(fechaEntrega), fechaEntregaCheck || false, toDateMySQL(fechaCompra), fechaCompraCheck || false, cliente, direccion || null, comuna || null, contacto || null, fonoPrincipal || null, tecnicoAsignado, equipo, modelo, marca, serie || null, contadorPagOut || null, nivelTinta || null, insumo1 || null, insumo2 || null, insumo3 || null, insumo4 || null, insumo5 || null, insumo6 || null, insumo7 || null, insumo8 || null, insumo9 || null, insumo10 || null, insumo11 || null, insumo12 || null, averia || null, finalClienteId, finalEquipoId, id]);

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
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;