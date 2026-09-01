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

// Emails con formato válido (ignora los vacíos)
function hayEmailInvalido(...valores) {
  return valores.some((v) => String(v || "").trim() && !validarEmail(v));
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*,
        (SELECT IFNULL(GROUP_CONCAT(
          CONCAT(IFNULL(d.tipo_direccion, ''), '|', IFNULL(d.direccion, ''), '|', IFNULL(d.fono, ''), '|', IFNULL(d.ciudad, ''), '|', IFNULL(d.comuna, ''))
        ORDER BY d.id SEPARATOR ';;'), '') FROM clientes_direcciones d WHERE d.cliente_id = c.id) as direcciones,
        (SELECT IFNULL(GROUP_CONCAT(
          CONCAT(IFNULL(co.nombre, ''), '|', IFNULL(co.email, ''), '|', IFNULL(co.fono, ''), '|', IFNULL(co.cargo, ''), '|', IFNULL(co.direccion, ''))
        ORDER BY co.id SEPARATOR ';;'), '') FROM clientes_contactos co WHERE co.cliente_id = c.id) as contactos
      FROM clientes c
      ORDER BY c.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*,
        (SELECT IFNULL(GROUP_CONCAT(
          CONCAT(IFNULL(d.tipo_direccion, ''), '|', IFNULL(d.direccion, ''), '|', IFNULL(d.fono, ''), '|', IFNULL(d.ciudad, ''), '|', IFNULL(d.comuna, ''))
        ORDER BY d.id SEPARATOR ';;'), '') FROM clientes_direcciones d WHERE d.cliente_id = c.id) as direcciones,
        (SELECT IFNULL(GROUP_CONCAT(
          CONCAT(IFNULL(co.nombre, ''), '|', IFNULL(co.email, ''), '|', IFNULL(co.fono, ''), '|', IFNULL(co.cargo, ''), '|', IFNULL(co.direccion, ''))
        ORDER BY co.id SEPARATOR ';;'), '') FROM clientes_contactos co WHERE co.cliente_id = c.id) as contactos
      FROM clientes c
      WHERE c.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Cliente no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const {
    razon_social, giro, rut, direccion, ciudad, comuna, telefono, email,
    contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion,
    direcciones, contactos
  } = req.body;
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
    // Emails con formato válido: empresa, contacto principal y contactos adicionales
    if (hayEmailInvalido(email, contacto_email, ...(Array.isArray(contactos) ? contactos.map((c) => c?.email) : []))) {
      return res.status(400).json({ msg: "Email inválido" });
    }
    const [result] = await pool.query(
      `INSERT INTO clientes (codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion]
    );
    const clienteId = result.insertId;

    if (direcciones && direcciones.length > 0) {
      for (const d of direcciones) {
        if (d.direccion && d.direccion.trim()) {
          await pool.query(
            "INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES (?, ?, ?, ?, ?, ?)",
            [clienteId, d.tipo_direccion || '', d.direccion, d.fono || '', d.ciudad || '', d.comuna || '']
          );
        }
      }
    }

    if (contactos && contactos.length > 0) {
      for (const c of contactos) {
        if (c.nombre && c.nombre.trim()) {
          await pool.query(
            "INSERT INTO clientes_contactos (cliente_id, nombre, email, fono, cargo, direccion) VALUES (?, ?, ?, ?, ?, ?)",
            [clienteId, c.nombre, c.email || '', c.fono || '', c.cargo || '', c.direccion || '']
          );
        }
      }
    }

    res.status(201).json({ msg: "Cliente creado", codigo, id: clienteId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const {
    razon_social, giro, rut, direccion, ciudad, comuna, telefono, email,
    contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion,
    direcciones, contactos
  } = req.body;
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
    // Emails con formato válido: empresa, contacto principal y contactos adicionales
    if (hayEmailInvalido(email, contacto_email, ...(Array.isArray(contactos) ? contactos.map((c) => c?.email) : []))) {
      connection.release();
      return res.status(400).json({ msg: "Email inválido" });
    }
    const [existing] = await connection.query("SELECT codigo FROM clientes WHERE id = ?", [id]);
    let codigo = existing[0]?.codigo;
    if (!codigo) codigo = await generarCodigo();

    await connection.beginTransaction();
    await connection.query(
      `UPDATE clientes SET codigo=?, razon_social=?, giro=?, rut=?, direccion=?, ciudad=?, comuna=?, telefono=?, email=?, contacto_nombre=?, contacto_email=?, contacto_fono=?, contacto_cargo=?, contacto_direccion=? WHERE id=?`,
      [codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion, id]
    );
    await connection.query("DELETE FROM clientes_direcciones WHERE cliente_id = ?", [id]);
    if (direcciones && direcciones.length > 0) {
      for (const d of direcciones) {
        if (d.direccion && d.direccion.trim()) {
          await connection.query(
            "INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES (?, ?, ?, ?, ?, ?)",
            [id, d.tipo_direccion || '', d.direccion, d.fono || '', d.ciudad || '', d.comuna || '']
          );
        }
      }
    }
    await connection.query("DELETE FROM clientes_contactos WHERE cliente_id = ?", [id]);
    if (contactos && contactos.length > 0) {
      for (const c of contactos) {
        if (c.nombre && c.nombre.trim()) {
          await connection.query(
            "INSERT INTO clientes_contactos (cliente_id, nombre, email, fono, cargo, direccion) VALUES (?, ?, ?, ?, ?, ?)",
            [id, c.nombre, c.email || '', c.fono || '', c.cargo || '', c.direccion || '']
          );
        }
      }
    }
    await connection.query(
      `UPDATE ordenes_trabajo SET cliente = ?, direccion = ?, comuna = ?, rut = ?, contacto = ?, fono_principal = ? WHERE cliente_id = ?`,
      [razon_social, direccion || null, comuna || null, rut || null, contacto_nombre || null, telefono || null, id]
    );
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
