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
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM clientes WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ msg: "Cliente no encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { razon_social, rut, direccion, ciudad, comuna, telefono, email } = req.body;
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
    const [result] = await pool.query(
      `INSERT INTO clientes (codigo, razon_social, rut, direccion, ciudad, comuna, telefono, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, razon_social, rut, direccion || '', ciudad || '', comuna || '', telefono || '', email || '']
    );
    res.status(201).json({ msg: "Cliente creado", codigo, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { razon_social, rut, direccion, ciudad, comuna, telefono, email } = req.body;
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
      `UPDATE clientes SET codigo=?, razon_social=?, rut=?, direccion=?, ciudad=?, comuna=?, telefono=?, email=? WHERE id=?`,
      [codigo, razon_social, rut, direccion || '', ciudad || '', comuna || '', telefono || '', email || '', id]
    );
    // Sincroniza en las OT de este cliente solo sus datos propios (Contacto
    // ya no se deriva de Cliente — vive aparte en el catálogo de Contactos
    // y se administra por OT, no se pisa acá).
    await connection.query(
      `UPDATE ordenes_trabajo SET cliente = ?, direccion = ?, ciudad = ?, comuna = ?, rut = ?, fono_principal = ?, email = ? WHERE cliente_id = ?`,
      [razon_social, direccion || null, ciudad || null, comuna || null, rut || null, telefono || null, email || null, id]
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
