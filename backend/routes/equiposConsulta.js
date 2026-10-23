import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { filtrosListadoEquipos, filtrosBusquedaEquipos, ordenSugerenciasEquipos, leerLimiteSugerencias } from "../utils/filtrosEquipos.js";
import { leerPaginacion, numerarMarcadores } from "../utils/filtrosOrdenes.js";

// Consultas de Equipos: listado (con paginación en el servidor), buscador por texto y verificación de
// un equipo repetido. Las altas, ediciones y bajas están en equipos.js, que monta este router antes
// de sus rutas /:id.
const router = express.Router();

// Con ?pagina=&limite=&modelo=: una página del listado de Equipos ({ equipos, pagination }).
// Con ?q=texto: hasta ?limite= (por defecto 20) equipos que coinciden (sugerencias de la OT).
// Sin parámetros: todos los equipos.
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.query.pagina !== undefined) {
      const { pagina, limite, offset } = leerPaginacion(req.query);
      const { where, params } = filtrosListadoEquipos(req.query);
      const result = await pool.query(numerarMarcadores(`SELECT * FROM equipos ${where} ORDER BY id DESC LIMIT ? OFFSET ?`), [...params, limite, offset]);
      const total = await pool.query(numerarMarcadores(`SELECT COUNT(*) AS total FROM equipos ${where}`), params);
      const totalItems = parseInt(total.rows[0].total);
      return res.json({
        equipos: result.rows,
        pagination: { currentPage: pagina, totalPages: Math.ceil(totalItems / limite), totalItems, itemsPerPage: limite }
      });
    }
    const q = String(req.query.q || "").trim();
    if (q) {
      const { where, params } = filtrosBusquedaEquipos(q);
      const { orderBy, params: paramsOrden } = ordenSugerenciasEquipos(q);
      const result = await pool.query(numerarMarcadores(`SELECT * FROM equipos ${where} ${orderBy} LIMIT ?`), [...params, ...paramsOrden, leerLimiteSugerencias(req.query)]);
      return res.json(result.rows);
    }
    const result = await pool.query("SELECT * FROM equipos ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// ¿Existe ya este equipo (mismo Equipo + Marca + Modelo, sin distinguir mayúsculas ni espacios)?
// GET /api/equipos/verificar?equipo=&marca=&modelo= -> { equipo: {...} | null }
router.get("/verificar", authMiddleware, async (req, res) => {
  try {
    const equipo = String(req.query.equipo || "").trim();
    if (!equipo) return res.json({ equipo: null });
    const result = await pool.query(
      `SELECT * FROM equipos
       WHERE LOWER(TRIM(equipo)) = LOWER($1) AND LOWER(TRIM(COALESCE(marca,''))) = LOWER($2) AND LOWER(TRIM(COALESCE(modelo,''))) = LOWER($3)
       LIMIT 1`,
      [equipo, String(req.query.marca || "").trim(), String(req.query.modelo || "").trim()]
    );
    res.json({ equipo: result.rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

export default router;
