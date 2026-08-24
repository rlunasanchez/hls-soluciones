import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware, adminOnly } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

async function generarCodigo() {
  const result = await pool.query("SELECT codigo FROM clientes WHERE codigo LIKE 'CL-%' ORDER BY id DESC LIMIT 1");
  if (result.rows.length === 0) return "CL-0001";
  const num = parseInt(result.rows[0].codigo.split("-")[1], 10) || 0;
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
  const result = await pool.query("SELECT id, codigo, rut FROM clientes");
  return result.rows.find((c) => c.id !== excluirId && normalizarRut(c.rut) === objetivo) || null;
}

// Valida formato básico de email: texto@texto.texto (vacío es válido, se valida aparte)
function validarEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

// Emails con formato válido (ignora los vacíos)
function hayEmailInvalido(...valores) {
  return valores.some((v) => String(v || "").trim() && !validarEmail(v));
}

router.get("/next-codigo", authMiddleware, async (req, res) => {
  try {
    const codigo = await generarCodigo();
    res.json({ codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        COALESCE(STRING_AGG(
          DISTINCT CONCAT(COALESCE(cd.tipo_direccion, ''), '|', COALESCE(cd.direccion, ''), '|', COALESCE(cd.fono, ''), '|', COALESCE(cd.ciudad, ''), '|', COALESCE(cd.comuna, ''))
        , ';;') FILTER (WHERE cd.id IS NOT NULL), '') as direcciones,
        COALESCE(STRING_AGG(
          DISTINCT CONCAT(COALESCE(co.nombre, ''), '|', COALESCE(co.email, ''), '|', COALESCE(co.fono, ''), '|', COALESCE(co.cargo, ''), '|', COALESCE(co.direccion, ''))
        , ';;') FILTER (WHERE co.id IS NOT NULL), '') as contactos
      FROM clientes c
      LEFT JOIN clientes_direcciones cd ON c.id = cd.cliente_id
      LEFT JOIN clientes_contactos co ON c.id = co.cliente_id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id/equipos", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, codigo, equipo, marca, modelo, serie FROM equipos WHERE cliente_id = $1 AND activo = true",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        COALESCE(STRING_AGG(
          DISTINCT CONCAT(COALESCE(cd.tipo_direccion, ''), '|', COALESCE(cd.direccion, ''), '|', COALESCE(cd.fono, ''), '|', COALESCE(cd.ciudad, ''), '|', COALESCE(cd.comuna, ''))
        , ';;') FILTER (WHERE cd.id IS NOT NULL), '') as direcciones,
        COALESCE(STRING_AGG(
          DISTINCT CONCAT(COALESCE(co.nombre, ''), '|', COALESCE(co.email, ''), '|', COALESCE(co.fono, ''), '|', COALESCE(co.cargo, ''), '|', COALESCE(co.direccion, ''))
        , ';;') FILTER (WHERE co.id IS NOT NULL), '') as contactos
      FROM clientes c
      LEFT JOIN clientes_direcciones cd ON c.id = cd.cliente_id
      LEFT JOIN clientes_contactos co ON c.id = co.cliente_id
      WHERE c.id = $1
      GROUP BY c.id
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ msg: "Cliente no encontrado" });
    res.json(result.rows[0]);
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
    const result = await pool.query(
      `INSERT INTO clientes (codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email || null, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion]
    );
    const clienteId = result.rows[0].id;

    if (direcciones && direcciones.length > 0) {
      for (const d of direcciones) {
        if (d.direccion && d.direccion.trim()) {
          await pool.query(
            "INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES ($1, $2, $3, $4, $5, $6)",
            [clienteId, d.tipo_direccion || '', d.direccion, d.fono || '', d.ciudad || '', d.comuna || '']
          );
        }
      }
    }

    if (contactos && contactos.length > 0) {
      for (const c of contactos) {
        if (c.nombre && c.nombre.trim()) {
          await pool.query(
            "INSERT INTO clientes_contactos (cliente_id, nombre, email, fono, cargo, direccion) VALUES ($1, $2, $3, $4, $5, $6)",
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
    // Emails con formato válido: empresa, contacto principal y contactos adicionales
    if (hayEmailInvalido(email, contacto_email, ...(Array.isArray(contactos) ? contactos.map((c) => c?.email) : []))) {
      return res.status(400).json({ msg: "Email inválido" });
    }
    const result = await pool.query("SELECT codigo FROM clientes WHERE id = $1", [id]);
    let codigo = result.rows[0]?.codigo;
    if (!codigo) codigo = await generarCodigo();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE clientes SET codigo=$1, razon_social=$2, giro=$3, rut=$4, direccion=$5, ciudad=$6, comuna=$7, telefono=$8, email=$9, contacto_nombre=$10, contacto_email=$11, contacto_fono=$12, contacto_cargo=$13, contacto_direccion=$14 WHERE id=$15`,
        [codigo, razon_social, giro, rut, direccion, ciudad, comuna, telefono, email || null, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion, id]
      );
      await client.query("DELETE FROM clientes_direcciones WHERE cliente_id = $1", [id]);
      if (direcciones && direcciones.length > 0) {
        for (const d of direcciones) {
          if (d.direccion && d.direccion.trim()) {
            await client.query(
              "INSERT INTO clientes_direcciones (cliente_id, tipo_direccion, direccion, fono, ciudad, comuna) VALUES ($1, $2, $3, $4, $5, $6)",
              [id, d.tipo_direccion || '', d.direccion, d.fono || '', d.ciudad || '', d.comuna || '']
            );
          }
        }
      }
      await client.query("DELETE FROM clientes_contactos WHERE cliente_id = $1", [id]);
      if (contactos && contactos.length > 0) {
        for (const c of contactos) {
          if (c.nombre && c.nombre.trim()) {
            await client.query(
              "INSERT INTO clientes_contactos (cliente_id, nombre, email, fono, cargo, direccion) VALUES ($1, $2, $3, $4, $5, $6)",
              [id, c.nombre, c.email || '', c.fono || '', c.cargo || '', c.direccion || '']
            );
          }
        }
      }
      await client.query(
        `UPDATE ordenes_trabajo SET cliente = $1, direccion = $2, comuna = $3, rut = $4, contacto = $5, fono_principal = $6 WHERE cliente_id = $7`,
        [razon_social, direccion || null, comuna || null, rut || null, contacto_nombre || null, telefono || null, id]
      );
      await client.query("COMMIT");
      res.json({ msg: "Cliente actualizado", codigo });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id/desactivar", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE equipos SET cliente_id = NULL WHERE cliente_id = $1", [id]);
    await client.query("UPDATE clientes SET activo = false WHERE id = $1", [id]);
    await client.query("COMMIT");
    res.json({ msg: "Cliente desactivado y equipos desvinculados" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  } finally {
    client.release();
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
