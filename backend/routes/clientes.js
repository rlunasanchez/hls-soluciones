import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware, adminOnly } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const [rows] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(codigo, 4) AS UNSIGNED)) AS num FROM clientes WHERE codigo LIKE 'CL-%'"
  );
  const num = rows[0].num || 0;
  return `CL-${String(num + 1).padStart(4, "0")}`;
}

// Normaliza un RUT para comparar unicidad: solo dígitos y K en mayúscula.
// "12.345.678-k", "12345678-K" y "12345678k" quedan como "12345678K"
function normalizarRut(v) {
  return String(v || "").toUpperCase().replace(/[^0-9K]/g, "");
}

// Valida formato y dígito verificador (módulo 11) de un RUT chileno
function validarRutChileno(rut) {
  const norm = normalizarRut(rut);
  const m = norm.match(/^(\d{6,8})([0-9K])$/);
  if (!m) return false;
  const cuerpo = parseInt(m[1], 10);
  if (cuerpo < 100000) return false;
  let suma = 0, mul = 2;
  for (const d of m[1].split("").reverse()) {
    suma += parseInt(d, 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (suma % 11);
  const dv = res === 11 ? "0" : res === 10 ? "K" : String(res);
  return m[2] === dv;
}

// Busca otro cliente con el mismo RUT normalizado (compara en JS para que
// cualquier formato guardado en la BD matchee: sin guion, k minúscula, etc.)
async function buscarDuplicadoRut(rut, excluirId = null) {
  const objetivo = normalizarRut(rut);
  if (!objetivo) return null;
  const [rows] = await pool.query("SELECT id, codigo, rut FROM clientes");
  return rows.find((c) => c.id !== excluirId && normalizarRut(c.rut) === objetivo) || null;
}

// Valida formato básico de email: texto@texto.texto (vacío es válido, se valida aparte)
function validarEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM clientes ORDER BY id DESC`);
    res.json(await enriquecerClientes(rows));
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
async function sincronizarVinculos(conn, clienteId, tipo, ids, aOtId) {
  const { tabla, columna } = VINCULOS[tipo];
  if (aOtId === undefined) {
    const [prev] = await conn.query(`SELECT ${columna} AS ref FROM ${tabla} WHERE cliente_id = ? AND a_ot = 1`, [clienteId]);
    aOtId = prev[0]?.ref;
  }
  await conn.query(`DELETE FROM ${tabla} WHERE cliente_id = ?`, [clienteId]);
  if (ids.length > 0) {
    await conn.query(
      `INSERT IGNORE INTO ${tabla} (cliente_id, ${columna}, orden, a_ot) VALUES ?`,
      [ids.map((id, i) => [clienteId, id, i, Number(id) === Number(aOtId) ? 1 : 0])]
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
    return {
      ...r,
      // direccion / ciudad / comuna son los datos propios del cliente (no se tocan). La dirección
      // que viaja a la OT es la marcada "En la OT" y sale aparte, en ot_*.
      ot_direccion: dirPrincipal?.direccion || "",
      ot_ciudad: dirPrincipal?.ciudad || "",
      ot_comuna: dirPrincipal?.comuna || "",
      contacto_nombre: principal?.nombre || "",
      contacto_email: principal?.email || "",
      contacto_fono: principal?.fono || "",
      contacto_cargo: principal?.cargo || "",
      contacto_direccion: "",
      contactos: resto.map((c) => [c.nombre, c.email, c.fono, c.cargo, "", "", ""].map(limpiarCampo).join("|")).join(SEP_REG),
      direcciones: (md.get(r.id) || []).map((d) => ["", d.direccion, "", d.ciudad, d.comuna].map(limpiarCampo).join("|")).join(SEP_REG),
    };
  });
}

async function siguienteCodigo(conn, tabla, prefijo) {
  const [rows] = await conn.query(
    `SELECT MAX(CAST(SUBSTRING(codigo, 4) AS UNSIGNED)) AS num FROM ${tabla} WHERE codigo LIKE '${prefijo}-%'`);
  return `${prefijo}-${String((rows[0].num || 0) + 1).padStart(4, "0")}`;
}

// Busca por nombre (o crea) un contacto del catálogo. No pisa uno existente.
async function contactoDeCatalogo(conn, c) {
  const nombre = String(c?.nombre || "").trim();
  if (nombre.length < 3) return null;
  const [ex] = await conn.query("SELECT id FROM contactos WHERE LOWER(TRIM(nombre)) = LOWER(?) LIMIT 1", [nombre]);
  if (ex.length > 0) return ex[0].id;
  const [ins] = await conn.query(
    "INSERT INTO contactos (codigo, nombre, email, fono, cargo) VALUES (?, ?, ?, ?, ?)",
    [await siguienteCodigo(conn, "contactos", "CO"), nombre, c.email || null, c.fono || null, c.cargo || null]);
  return ins.insertId;
}

// Busca por texto (o crea) una dirección del catálogo. No pisa una existente.
async function direccionDeCatalogo(conn, d) {
  const direccion = String(d?.direccion || "").trim();
  if (direccion.length < 5) return null;
  const [ex] = await conn.query("SELECT id FROM direcciones WHERE LOWER(TRIM(direccion)) = LOWER(?) LIMIT 1", [direccion]);
  if (ex.length > 0) return ex[0].id;
  const [ins] = await conn.query(
    "INSERT INTO direcciones (codigo, direccion, ciudad, comuna) VALUES (?, ?, ?, ?)",
    [await siguienteCodigo(conn, "direcciones", "DI"), direccion, d.ciudad || null, d.comuna || null]);
  return ins.insertId;
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
    await pool.query("UPDATE cliente_contactos SET a_ot = 0 WHERE cliente_id = ?", [req.params.id]);
    await pool.query("UPDATE cliente_direcciones SET a_ot = 0 WHERE cliente_id = ?", [req.params.id]);
    res.json({ msg: "Marcas limpiadas" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id/:tipo(contactos|direcciones)", authMiddleware, async (req, res) => {
  try {
    const { tabla, columna, catalogo } = VINCULOS[req.params.tipo];
    const [rows] = await pool.query(
      `SELECT c.*, v.a_ot FROM ${catalogo} c JOIN ${tabla} v ON v.${columna} = c.id WHERE v.cliente_id = ? ORDER BY v.orden, c.id`,
      [req.params.id]
    );
    res.json(rows);
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
      `INSERT IGNORE INTO ${tabla} (cliente_id, ${columna}, orden)
       SELECT ?, ?, IFNULL(MAX(orden) + 1, 0) FROM ${tabla} WHERE cliente_id = ?`,
      [req.params.id, refId, req.params.id]
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
    await pool.query(`DELETE FROM ${tabla} WHERE cliente_id = ? AND ${columna} = ?`, [req.params.id, req.params.refId]);
    res.json({ msg: "Vínculo eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM clientes WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Cliente no encontrado" });
    res.json((await enriquecerClientes(rows))[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { razon_social, giro, rut, direccion, ciudad, comuna, telefono, email } = req.body;
  const codigo = await generarCodigo();
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
      // RUT único: comparación normalizada (solo dígitos + K, ignora formato guardado)
      const dup = await buscarDuplicadoRut(rut);
      if (dup) {
        return res.status(400).json({ msg: `El cliente ya existe (${dup.codigo || "CL-????"})` });
      }
    }
    if (String(email || "").trim() && !validarEmail(email)) {
      return res.status(400).json({ msg: "Email inválido" });
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO clientes (codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [codigo, razon_social, giro || '', rut, direccion || '', ciudad || '', comuna || '', telefono || '', email || '']
      );
      const vinc = await idsDeVinculos(connection, req.body);
      if (vinc.contactos) await sincronizarVinculos(connection, result.insertId, "contactos", vinc.contactos, vinc.contactoAOt);
      if (vinc.direcciones) await sincronizarVinculos(connection, result.insertId, "direcciones", vinc.direcciones, vinc.direccionAOt);
      await connection.commit();
      res.status(201).json({ msg: "Cliente creado", codigo, id: result.insertId });
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { razon_social, giro, rut, direccion, ciudad, comuna, telefono, email } = req.body;
  const connection = await pool.getConnection();
  try {
    // Datos mínimos obligatorios: Razón Social + RUT
    if (!razon_social || !razon_social.trim()) {
      connection.release();
      return res.status(400).json({ msg: "Ingrese la Razón Social" });
    }
    if (!rut || !rut.trim()) {
      connection.release();
      return res.status(400).json({ msg: "Ingrese el RUT" });
    }
    // RUT "19" = comodín para clientes sin RUT conocido: se permite repetir sin validación
    if (normalizarRut(rut) !== "19") {
      if (!validarRutChileno(rut)) {
        connection.release();
        return res.status(400).json({ msg: "RUT inválido" });
      }
      // RUT único: comparación normalizada (excluyendo este cliente)
      const dup = await buscarDuplicadoRut(rut, Number(id));
      if (dup) {
        connection.release();
        return res.status(400).json({ msg: `El RUT ya existe (${dup.codigo || "CL-????"})` });
      }
    }
    if (String(email || "").trim() && !validarEmail(email)) {
      connection.release();
      return res.status(400).json({ msg: "Email inválido" });
    }
    const [existing] = await connection.query("SELECT codigo FROM clientes WHERE id = ?", [id]);
    let codigo = existing[0]?.codigo;
    if (!codigo) codigo = await generarCodigo();

    await connection.beginTransaction();
    await connection.query(
      `UPDATE clientes SET codigo=?, razon_social=?, giro=?, rut=?, direccion=?, ciudad=?, comuna=?, telefono=?, email=? WHERE id=?`,
      [codigo, razon_social, giro || '', rut, direccion || '', ciudad || '', comuna || '', telefono || '', email || '', id]
    );
    // Sincroniza en las OT de este cliente solo sus datos propios (Contacto
    // ya no se deriva de Cliente — vive aparte en el catálogo de Contactos
    // y se administra por OT, no se pisa acá).
    await connection.query(
      `UPDATE ordenes_trabajo SET cliente = ?, rut = ?, fono_principal = ?, email = ? WHERE cliente_id = ?`,
      [razon_social, rut || null, telefono || null, email || null, id]
    );
    // Vínculos: solo si el formulario los envía (así otros llamados al PUT no los borran)
    const vinc = await idsDeVinculos(connection, req.body);
    if (vinc.contactos) await sincronizarVinculos(connection, id, "contactos", vinc.contactos, vinc.contactoAOt);
    if (vinc.direcciones) await sincronizarVinculos(connection, id, "direcciones", vinc.direcciones, vinc.direccionAOt);
    await connection.commit();
    res.json({ msg: "Cliente actualizado", codigo });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  } finally {
    connection.release();
  }
});

router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM clientes WHERE id = ?", [id]);
    res.json({ msg: "Cliente eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
