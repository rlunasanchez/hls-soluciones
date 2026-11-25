import express from "express";
import dotenv from "dotenv";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import consultaCatalogo from "./catalogoConsulta.js";
import { CATALOGOS } from "../utils/catalogoConsulta.js";
import { sincronizarOrdenesDeContacto, reenlazarOrdenesDeContacto, desvincularOrdenes } from "./ordenesVinculos.js";

dotenv.config();
const router = express.Router();

// Mantenedor de Contactos: catálogo global, independiente de Cliente (mismo
// espíritu que Equipos — sin FK a clientes). Se "llama" desde la OT/Cotización
// buscando y copiando los campos, no por referencia viva.
async function generarCodigo() {
  const [rows] = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(codigo, 4) AS UNSIGNED)) AS num FROM contactos WHERE codigo LIKE 'CO-%'"
  );
  const num = rows[0].num || 0;
  return `CO-${String(num + 1).padStart(4, "0")}`;
}

// Listado paginado y buscador: consulta compartida de los catálogos (catalogoConsulta.js). Va antes de las rutas /:id.
router.use(consultaCatalogo(CATALOGOS.contactos));

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM contactos WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ msg: "Contacto no encontrado" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { nombre, email, fono, cargo, reutilizar } = req.body;
  try {
    if (!nombre || nombre.trim().length < 3) {
      return res.status(400).json({ msg: "Ingrese el nombre completo del contacto (mínimo 3 caracteres)" });
    }
    const [dup] = await pool.query(
      `SELECT id, codigo FROM contactos WHERE LOWER(TRIM(nombre)) = LOWER(?) LIMIT 1`,
      [nombre.trim()]
    );
    if (dup.length > 0) {
      // Desde Cliente/OT/Cotización se llama con reutilizar: se usa el contacto
      // existente en vez de dar error (el mantenedor propio sigue siendo estricto).
      if (reutilizar) {
        return res.json({ msg: "Contacto existente", id: dup[0].id, codigo: dup[0].codigo, existente: true });
      }
      return res.status(400).json({ msg: `El contacto "${nombre.trim()}" ya existe en el mantenedor con el código ${dup[0].codigo}. No se creó un nuevo registro.` });
    }
    const codigo = await generarCodigo();
    const [ins] = await pool.query(
      `INSERT INTO contactos (codigo, nombre, email, fono, cargo)
      VALUES (?, ?, ?, ?, ?)`,
      [codigo, nombre.trim(), email || null, fono || null, cargo || null]
    );
    await reenlazarOrdenesDeContacto(pool, ins.insertId, nombre);
    res.status(201).json({ msg: "Contacto creado", id: ins.insertId, codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nombre, email, fono, cargo } = req.body;
  try {
    if (!nombre || nombre.trim().length < 3) {
      return res.status(400).json({ msg: "Ingrese el nombre completo del contacto (mínimo 3 caracteres)" });
    }
    const [existing] = await pool.query("SELECT codigo FROM contactos WHERE id = ?", [id]);
    let codigo = existing[0]?.codigo;
    if (!codigo) {
      codigo = await generarCodigo();
    }
    await pool.query(
      `UPDATE contactos SET codigo = ?, nombre = ?, email = ?, fono = ?, cargo = ? WHERE id = ?`,
      [codigo, nombre.trim(), email || null, fono || null, cargo || null, id]
    );
    // Las OT vinculadas a este contacto toman sus datos nuevos
    await sincronizarOrdenesDeContacto(pool, id, { nombre: nombre.trim(), email, fono, cargo });
    res.json({ msg: "Contacto actualizado", codigo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // Un contacto del catálogo puede estar vinculado a varios clientes; borrarlo se los
    // quita a todos. Sin ?forzar=1 se avisa primero qué clientes lo usan.
    if (!req.query.forzar) {
      const [usados] = await pool.query(
        `SELECT cl.codigo, cl.razon_social FROM cliente_contactos v JOIN clientes cl ON cl.id = v.cliente_id
         WHERE v.contacto_id = ? ORDER BY cl.razon_social`, [id]);
      if (usados.length > 0) {
        return res.status(409).json({ msg: "El contacto está vinculado a clientes", clientes: usados });
      }
    }
    await pool.query("DELETE FROM contactos WHERE id = ?", [id]);
    await desvincularOrdenes(pool, "contacto", id);
    res.json({ msg: "Contacto eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
