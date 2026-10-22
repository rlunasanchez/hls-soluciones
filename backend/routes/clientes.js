import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware, adminOnly } from "../middleware/authMiddleware.js";
import { numerarMarcadores } from "../utils/filtrosOrdenes.js";
import { normalizarRut, validarRutChileno, validarEmail } from "../utils/validaciones.js";
import { buscarClientesSql, leerLimiteBusqueda, MIN_BUSQUEDA } from "../utils/busquedaClientes.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const result = await pool.query("SELECT codigo FROM clientes WHERE codigo LIKE 'CL-%' ORDER BY id DESC LIMIT 1");
  if (result.rows.length === 0) return "CL-0001";
  const num = parseInt(result.rows[0].codigo.split("-")[1], 10) || 0;
  return `CL-${String(num + 1).padStart(4, "0")}`;
}

// Busca otro cliente con el mismo RUT normalizado (compara en JS para que
// cualquier formato guardado en la BD matchee: sin guion, k minúscula, etc.)
async function buscarDuplicadoRut(rut, excluirId = null) {
  const objetivo = normalizarRut(rut);
  if (!objetivo) return null;
  const result = await pool.query("SELECT id, codigo, rut FROM clientes");
  return result.rows.find((c) => c.id !== excluirId && normalizarRut(c.rut) === objetivo) || null;
}

// Sin parámetros: todos los clientes (listado de Clientes). Con ?q=texto (2+ caracteres): solo los
// que coinciden, hasta ?limite= (por defecto 10), ya con su contacto y dirección de la OT.
router.get("/", authMiddleware, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length >= MIN_BUSQUEDA) {
      const { where, params } = buscarClientesSql(q);
      const result = await pool.query(numerarMarcadores(`SELECT * FROM clientes ${where} ORDER BY id DESC LIMIT ?`), [...params, leerLimiteBusqueda(req.query)]);
      return res.json(await enriquecerClientes(result.rows));
    }
    if (req.query.q !== undefined) return res.json([]);
    const result = await pool.query(`SELECT * FROM clientes ORDER BY id DESC`);
    res.json(await enriquecerClientes(result.rows));
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
    const unico = async (sql, params) => (await pool.query(sql, params)).rows[0] || null;
    const dup = await buscarDuplicadoRut(req.query.rut);
    const porRut = dup ? await unico(`SELECT ${campos} FROM clientes WHERE id = $1`, [dup.id]) : null;
    const nombre = String(req.query.razon_social || "").trim().toUpperCase();
    const porNombre = nombre ? await unico(`SELECT ${campos} FROM clientes WHERE UPPER(TRIM(razon_social)) = $1 LIMIT 1`, [nombre]) : null;
    res.json({ porRut, porNombre });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Vínculos Cliente <-> Contactos / Direcciones (muchos a muchos). Contactos y
// Direcciones siguen siendo catálogos globales; acá solo se relacionan.
const VINCULOS = {
  contactos: { tabla: "cliente_contactos", columna: "contacto_id", catalogo: "contactos" },
  direcciones: { tabla: "cliente_direcciones", columna: "direccion_id", catalogo: "direcciones" },
};

function idsValidos(v) {
  return [...new Set((Array.isArray(v) ? v : []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
}

// Reemplaza el conjunto de vínculos de un cliente (ids = lista final, en orden;
// el primero es el principal)
// aOtId = el contacto/dirección marcado "En la OT": un id lo marca, null deja
// ninguno, undefined conserva el que ya estaba marcado (si sigue vinculado).
// `conn` es un cliente de pg (dentro de una transacción) o el pool.
async function sincronizarVinculos(conn, clienteId, tipo, ids, aOtId) {
  const { tabla, columna } = VINCULOS[tipo];
  if (aOtId === undefined) {
    const prev = await conn.query(`SELECT ${columna} AS ref FROM ${tabla} WHERE cliente_id = $1 AND a_ot = 1`, [clienteId]);
    aOtId = prev.rows[0]?.ref;
  }
  await conn.query(`DELETE FROM ${tabla} WHERE cliente_id = $1`, [clienteId]);
  for (let i = 0; i < ids.length; i++) {
    await conn.query(
      `INSERT INTO ${tabla} (cliente_id, ${columna}, orden, a_ot) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [clienteId, ids[i], i, Number(ids[i]) === Number(aOtId) ? 1 : 0]
    );
  }
}

// --- Compatibilidad con la OT/Cotización (diseño de la nube) ---
// Esas pantallas leen del cliente: contacto_nombre/email/fono/cargo (principal),
// "contactos" y "direcciones" como texto separado por ";;" con campos por "|".
// Acá se arman a partir de los contactos/direcciones VINCULADOS (mantenedores),
// y al escribir se aceptan esas mismas listas, que se convierten en
// altas/reutilizaciones sobre los mantenedores + vínculos.
const SEP_REG = ";;";
const limpiarCampo = (v) => String(v ?? "").replace(/[|;]/g, " ").trim();

async function enriquecerClientes(rows) {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const cos = (await pool.query(
    `SELECT v.cliente_id, v.a_ot, c.* FROM cliente_contactos v JOIN contactos c ON c.id = v.contacto_id
     WHERE v.cliente_id = ANY($1::int[]) ORDER BY v.cliente_id, v.orden, c.id`, [ids])).rows;
  const dis = (await pool.query(
    `SELECT v.cliente_id, v.a_ot, d.* FROM cliente_direcciones v JOIN direcciones d ON d.id = v.direccion_id
     WHERE v.cliente_id = ANY($1::int[]) ORDER BY v.cliente_id, v.orden, d.id`, [ids])).rows;
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

async function siguienteCodigo(conn, tabla, prefijo) {
  const result = await conn.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 4) AS INTEGER)), 0) AS num FROM ${tabla} WHERE codigo ~ '^${prefijo}-[0-9]+$'`);
  return `${prefijo}-${String(Number(result.rows[0].num) + 1).padStart(4, "0")}`;
}

// Busca por nombre (o crea) un contacto del catálogo. No pisa uno existente.
async function contactoDeCatalogo(conn, c) {
  const nombre = String(c?.nombre || "").trim();
  if (nombre.length < 3) return null;
  const ex = await conn.query("SELECT id FROM contactos WHERE LOWER(TRIM(nombre)) = LOWER($1) LIMIT 1", [nombre]);
  if (ex.rows.length > 0) return ex.rows[0].id;
  const ins = await conn.query(
    "INSERT INTO contactos (codigo, nombre, email, fono, cargo) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [await siguienteCodigo(conn, "contactos", "CO"), nombre, c.email || null, c.fono || null, c.cargo || null]);
  return ins.rows[0].id;
}

// Busca por texto (o crea) una dirección del catálogo. No pisa una existente.
async function direccionDeCatalogo(conn, d) {
  const direccion = String(d?.direccion || "").trim();
  if (direccion.length < 5) return null;
  const ex = await conn.query("SELECT id FROM direcciones WHERE LOWER(TRIM(direccion)) = LOWER($1) LIMIT 1", [direccion]);
  if (ex.rows.length > 0) return ex.rows[0].id;
  const ins = await conn.query(
    "INSERT INTO direcciones (codigo, direccion, ciudad, comuna) VALUES ($1, $2, $3, $4) RETURNING id",
    [await siguienteCodigo(conn, "direcciones", "DI"), direccion, d.ciudad || null, d.comuna || null]);
  return ins.rows[0].id;
}

// Resuelve qué ids vincular según lo que mande el formulario:
//  - contacto_ids / direccion_ids  -> formulario nuevo (ids del catálogo)
//  - contacto_nombre + contactos[] / direcciones[] -> listas del diseño de la nube
//  - nada de lo anterior -> undefined (no se tocan los vínculos)
async function idsDeVinculos(conn, body) {
  const out = {};
  // contactoAOt / direccionAOt: id marcado "En la OT"; null = ninguno; undefined = no cambiar
  if (Array.isArray(body.contacto_ids)) {
    out.contactos = idsValidos(body.contacto_ids);
    if ("contacto_a_ot_id" in body) out.contactoAOt = Number(body.contacto_a_ot_id) > 0 ? Number(body.contacto_a_ot_id) : null;
  } else if (Array.isArray(body.contactos) || body.contacto_nombre !== undefined) {
    const lista = [];
    if (String(body.contacto_nombre || "").trim()) {
      lista.push({ nombre: body.contacto_nombre, email: body.contacto_email, fono: body.contacto_fono, cargo: body.contacto_cargo });
    }
    for (const c of Array.isArray(body.contactos) ? body.contactos : []) lista.push(c);
    const ids = [];
    for (const c of lista) { const id = await contactoDeCatalogo(conn, c); if (id && !ids.includes(id)) ids.push(id); }
    out.contactos = ids;
    // Formato de la nube: el contacto_nombre es el que viaja a la OT
    if (String(body.contacto_nombre || "").trim() && ids.length > 0) out.contactoAOt = ids[0];
  }
  if (Array.isArray(body.direccion_ids)) {
    out.direcciones = idsValidos(body.direccion_ids);
    if ("direccion_a_ot_id" in body) out.direccionAOt = Number(body.direccion_a_ot_id) > 0 ? Number(body.direccion_a_ot_id) : null;
  } else if (Array.isArray(body.direcciones)) {
    const ids = [];
    for (const d of body.direcciones) { const id = await direccionDeCatalogo(conn, d); if (id && !ids.includes(id)) ids.push(id); }
    out.direcciones = ids;
  }
  return out;
}

// Los checks "En la OT" son de un solo uso: una vez que los datos se enviaron a la OT
// se desmarcan (contacto y dirección). No borra ningún contacto ni dirección.
router.post("/:id/limpiar-a-ot", authMiddleware, async (req, res) => {
  try {
    await pool.query("UPDATE cliente_contactos SET a_ot = 0 WHERE cliente_id = $1", [req.params.id]);
    await pool.query("UPDATE cliente_direcciones SET a_ot = 0 WHERE cliente_id = $1", [req.params.id]);
    res.json({ msg: "Marcas limpiadas" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id/:tipo(contactos|direcciones)", authMiddleware, async (req, res) => {
  try {
    const { tabla, columna, catalogo } = VINCULOS[req.params.tipo];
    const result = await pool.query(
      `SELECT c.*, v.a_ot FROM ${catalogo} c JOIN ${tabla} v ON v.${columna} = c.id WHERE v.cliente_id = $1 ORDER BY v.orden, c.id`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/:id/:tipo(contactos|direcciones)", authMiddleware, async (req, res) => {
  try {
    const { tabla, columna } = VINCULOS[req.params.tipo];
    const refId = Number(req.body[columna]);
    if (!Number.isInteger(refId) || refId <= 0) return res.status(400).json({ msg: "Registro inválido" });
    await pool.query(
      `INSERT INTO ${tabla} (cliente_id, ${columna}, orden)
       SELECT $1::int, $2::int, COALESCE(MAX(orden) + 1, 0) FROM ${tabla} WHERE cliente_id = $1::int
       ON CONFLICT DO NOTHING`,
      [req.params.id, refId]
    );
    res.status(201).json({ msg: "Vinculado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id/:tipo(contactos|direcciones)/:refId", authMiddleware, async (req, res) => {
  try {
    const { tabla, columna } = VINCULOS[req.params.tipo];
    await pool.query(`DELETE FROM ${tabla} WHERE cliente_id = $1 AND ${columna} = $2`, [req.params.id, req.params.refId]);
    res.json({ msg: "Vínculo eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM clientes WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: "Cliente no encontrado" });
    res.json((await enriquecerClientes(result.rows))[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { razon_social, giro, rut, direccion, ciudad, comuna, telefono, email } = req.body;
  const tipo = req.body.tipo === "PERSONA" ? "PERSONA" : "EMPRESA";
  try {
    const codigo = await generarCodigo();
    // Datos mínimos obligatorios: Razón Social + RUT
    if (!razon_social || !razon_social.trim()) {
      return res.status(400).json({ msg: "Ingrese la Razón Social" });
    }
    if (!rut || !rut.trim()) {
      return res.status(400).json({ msg: "Ingrese el RUT" });
    }
    // RUT "19" = comodín para clientes sin RUT conocido: se permite repetir sin validación
    if (normalizarRut(rut) !== "19") {
      if (!validarRutChileno(rut)) {
        return res.status(400).json({ msg: "RUT inválido" });
      }
      // RUT único: comparación normalizada (solo dígitos + K, ignora formato guardado)
      const dup = await buscarDuplicadoRut(rut);
      if (dup) {
        return res.status(400).json({ msg: `El cliente ya existe (${dup.codigo || "CL-????"})` });
      }
    }
    if (String(email || "").trim() && !validarEmail(email)) {
      return res.status(400).json({ msg: "Email inválido" });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `INSERT INTO clientes (codigo, tipo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [codigo, tipo, razon_social, giro || '', rut, direccion || '', ciudad || '', comuna || '', telefono || '', email || '']
      );
      const nuevoId = result.rows[0].id;
      const vinc = await idsDeVinculos(client, req.body);
      if (vinc.contactos) await sincronizarVinculos(client, nuevoId, "contactos", vinc.contactos, vinc.contactoAOt);
      if (vinc.direcciones) await sincronizarVinculos(client, nuevoId, "direcciones", vinc.direcciones, vinc.direccionAOt);
      await client.query("COMMIT");
      res.status(201).json({ msg: "Cliente creado", codigo, id: nuevoId });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { razon_social, giro, rut, direccion, ciudad, comuna, telefono, email } = req.body;
  // Si el llamado no envía el tipo, se conserva el que ya tiene el cliente
  const tipoNuevo = req.body.tipo === "PERSONA" ? "PERSONA" : req.body.tipo === "EMPRESA" ? "EMPRESA" : null;
  try {
    // Datos mínimos obligatorios: Razón Social + RUT
    if (!razon_social || !razon_social.trim()) {
      return res.status(400).json({ msg: "Ingrese la Razón Social" });
    }
    if (!rut || !rut.trim()) {
      return res.status(400).json({ msg: "Ingrese el RUT" });
    }
    // RUT "19" = comodín para clientes sin RUT conocido: se permite repetir sin validación
    if (normalizarRut(rut) !== "19") {
      if (!validarRutChileno(rut)) {
        return res.status(400).json({ msg: "RUT inválido" });
      }
      // RUT único: comparación normalizada (excluyendo este cliente)
      const dup = await buscarDuplicadoRut(rut, Number(id));
      if (dup) {
        return res.status(400).json({ msg: `El RUT ya existe (${dup.codigo || "CL-????"})` });
      }
    }
    if (String(email || "").trim() && !validarEmail(email)) {
      return res.status(400).json({ msg: "Email inválido" });
    }
    const existing = await pool.query("SELECT codigo FROM clientes WHERE id = $1", [id]);
    let codigo = existing.rows[0]?.codigo;
    if (!codigo) codigo = await generarCodigo();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE clientes SET codigo=$1, tipo=COALESCE($2::varchar, tipo), razon_social=$3, giro=$4, rut=$5, direccion=$6, ciudad=$7, comuna=$8, telefono=$9, email=$10 WHERE id=$11`,
        [codigo, tipoNuevo, razon_social, giro || '', rut, direccion || '', ciudad || '', comuna || '', telefono || '', email || '', id]
      );
      // Sincroniza en las OT de este cliente solo sus datos propios (Contacto
      // ya no se deriva de Cliente — vive aparte en el catálogo de Contactos
      // y se administra por OT, no se pisa acá).
      await client.query(
        `UPDATE ordenes_trabajo SET cliente = $1, cliente_tipo = (SELECT tipo FROM clientes WHERE id = $2), rut = $3, fono_principal = $4, email = $5 WHERE cliente_id = $6`,
        [razon_social, id, rut || null, telefono || null, email || null, id]
      );
      // Vínculos: solo si el formulario los envía (así otros llamados al PUT no los borran)
      const vinc = await idsDeVinculos(client, req.body);
      if (vinc.contactos) await sincronizarVinculos(client, id, "contactos", vinc.contactos, vinc.contactoAOt);
      if (vinc.direcciones) await sincronizarVinculos(client, id, "direcciones", vinc.direcciones, vinc.direccionAOt);
      await client.query("COMMIT");
      res.json({ msg: "Cliente actualizado", codigo });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err.http) return res.status(err.http).json({ msg: err.message });
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM clientes WHERE id = $1", [id]);
    res.json({ msg: "Cliente eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
