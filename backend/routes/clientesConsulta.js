import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { normalizarRut } from "../utils/validaciones.js";
import { buscarClientesSql, filtrosListadoClientes, leerLimiteBusqueda, MIN_BUSQUEDA } from "../utils/busquedaClientes.js";
import { leerPaginacion } from "../utils/filtrosOrdenes.js";

// Consultas de Clientes: listado (con paginación en el servidor), buscador de la OT, verificación de
// RUT o razón social repetidos y armado de cada cliente con su contacto y dirección de la OT.
// Las altas, ediciones y vínculos están en clientes.js, que monta este router antes de sus rutas /:id.
const router = express.Router();

// Busca otro cliente con el mismo RUT normalizado (compara en JS para que
// cualquier formato guardado en la BD matchee: sin guion, k minúscula, etc.)
export async function buscarDuplicadoRut(rut, excluirId = null) {
  const objetivo = normalizarRut(rut);
  if (!objetivo) return null;
  const [rows] = await pool.query("SELECT id, codigo, rut FROM clientes");
  return rows.find((c) => c.id !== excluirId && normalizarRut(c.rut) === objetivo) || null;
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length >= MIN_BUSQUEDA) {
      const { where, params } = buscarClientesSql(q);
      const [rows] = await pool.query(`SELECT * FROM clientes ${where} ORDER BY id DESC LIMIT ?`, [...params, leerLimiteBusqueda(req.query)]);
      return res.json(await enriquecerClientes(rows));
    }
    if (req.query.q !== undefined) return res.json([]);
    if (req.query.pagina !== undefined) {
      const { pagina, limite, offset } = leerPaginacion(req.query);
      const { where, params } = filtrosListadoClientes(req.query);
      const [rows] = await pool.query(`SELECT * FROM clientes ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limite, offset]);
      const [total] = await pool.query(`SELECT COUNT(*) AS total FROM clientes ${where}`, params);
      const totalItems = parseInt(total[0].total);
      return res.json({
        clientes: await enriquecerClientes(rows),
        pagination: { currentPage: pagina, totalPages: Math.ceil(totalItems / limite), totalItems, itemsPerPage: limite }
      });
    }
    const [rows] = await pool.query(`SELECT * FROM clientes ORDER BY id DESC`);
    res.json(await enriquecerClientes(rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// ¿Ya existe un cliente con este RUT (normalizado) o esta razón social (sin distinguir mayúsculas)?
// Devuelve { porRut, porNombre }, cada uno con { id, codigo, razon_social, rut } o null.
router.get("/verificar", authMiddleware, async (req, res) => {
  try {
    const campos = "id, codigo, razon_social, rut";
    const unico = async (sql, params) => (await pool.query(sql, params))[0][0] || null;
    const dup = await buscarDuplicadoRut(req.query.rut);
    const porRut = dup ? await unico(`SELECT ${campos} FROM clientes WHERE id = ?`, [dup.id]) : null;
    const nombre = String(req.query.razon_social || "").trim().toUpperCase();
    const porNombre = nombre ? await unico(`SELECT ${campos} FROM clientes WHERE UPPER(TRIM(razon_social)) = ? LIMIT 1`, [nombre]) : null;
    res.json({ porRut, porNombre });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// --- Compatibilidad con la OT/Cotización (diseño de la nube) ---
// Esas pantallas leen del cliente: contacto_nombre/email/fono/cargo (principal),
// "contactos" y "direcciones" como texto separado por ";;" con campos por "|".
// Acá se arman a partir de los contactos/direcciones VINCULADOS (mantenedores),
// y al escribir se aceptan esas mismas listas, que se convierten en
// altas/reutilizaciones sobre los mantenedores + vínculos.
const SEP_REG = ";;";
const limpiarCampo = (v) => String(v ?? "").replace(/[|;]/g, " ").trim();

export async function enriquecerClientes(rows) {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const [cos] = await pool.query(
    `SELECT v.cliente_id, v.a_ot, c.* FROM cliente_contactos v JOIN contactos c ON c.id = v.contacto_id
     WHERE v.cliente_id IN (?) ORDER BY v.cliente_id, v.orden, c.id`, [ids]);
  const [dis] = await pool.query(
    `SELECT v.cliente_id, v.a_ot, d.* FROM cliente_direcciones v JOIN direcciones d ON d.id = v.direccion_id
     WHERE v.cliente_id IN (?) ORDER BY v.cliente_id, v.orden, d.id`, [ids]);
  const porCliente = (lista) => {
    const m = new Map();
    for (const r of lista) { if (!m.has(r.cliente_id)) m.set(r.cliente_id, []); m.get(r.cliente_id).push(r); }
    return m;
  };
  const mc = porCliente(cos), md = porCliente(dis);
  return rows.map((r) => {
    // Solo viaja a la OT el contacto/dirección marcado "En la OT" (a_ot). Sin marca no
    // viaja nada: el cliente no tiene contacto ni dirección por defecto.
    const listaC = mc.get(r.id) || [];
    const listaD = md.get(r.id) || [];
    const principal = listaC.find((c) => c.a_ot);
    const resto = listaC.filter((c) => c !== principal);
    const dirPrincipal = listaD.find((d) => d.a_ot);
    const esPersona = r.tipo === "PERSONA";
    // Persona: su dirección es la que tiene vinculada (la marcada "En la OT" o, si no hay marca
    // porque ya se usó, la primera). Empresa: solo la marcada.
    const dirOT = esPersona ? (dirPrincipal || listaD[0]) : dirPrincipal;
    return {
      ...r,
      // direccion / ciudad / comuna son los datos propios del cliente (no se tocan). La dirección
      // que viaja a la OT es la marcada "En la OT" y sale aparte, en ot_*.
      // Una PERSONA no tiene contacto. Su dirección es la
      // que tiene vinculada en el mantenedor de Direcciones.
      ot_direccion: dirOT?.direccion || "",
      ot_ciudad: dirOT?.ciudad || "",
      ot_comuna: dirOT?.comuna || "",
      // La persona no tiene contacto: sus datos (nombre, fono, email) ya van en Datos del cliente
      contacto_nombre: esPersona ? "" : (principal?.nombre || ""),
      contacto_email: esPersona ? "" : (principal?.email || ""),
      contacto_fono: esPersona ? "" : (principal?.fono || ""),
      contacto_cargo: esPersona ? "" : (principal?.cargo || ""),
      contacto_direccion: "",
      contactos: resto.map((c) => [c.nombre, c.email, c.fono, c.cargo, "", "", ""].map(limpiarCampo).join("|")).join(SEP_REG),
      direcciones: (md.get(r.id) || []).map((d) => ["", d.direccion, "", d.ciudad, d.comuna].map(limpiarCampo).join("|")).join(SEP_REG),
    };
  });
}


export default router;
