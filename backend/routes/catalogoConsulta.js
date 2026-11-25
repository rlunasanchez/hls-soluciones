import express from "express";
import pool from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { filtroListado, filtroBusqueda, ordenBusqueda, limiteSugerencias } from "../utils/catalogoConsulta.js";
import { leerPaginacion, paginacion } from "../utils/filtrosOrdenes.js";

// GET / de un catálogo (Contactos o Direcciones). Los routers de contactos.js y direcciones.js lo montan
// antes de sus rutas /:id.
//  - ?pagina=&limite=&<filtro>=  -> una página del listado: { [clave], pagination }
//  - ?q=texto                    -> hasta ?limite= (20 por defecto, máximo 50) sugerencias para los buscadores
//  - sin parámetros              -> los 100 más recientes
// `duenos`: clientes a los que está vinculado el registro ("id:codigo,id:codigo"); el buscador de la ficha
// oculta los ajenos. Se calcula solo para las filas que se devuelven.
export default function consultaCatalogo(cfg) {
  const router = express.Router();
  const columnas = `${cfg.tabla}.*,
      (SELECT GROUP_CONCAT(CONCAT(cl.id, ':', cl.codigo)) FROM ${cfg.vinculo} v
        JOIN clientes cl ON cl.id = v.cliente_id WHERE v.${cfg.columnaVinculo} = ${cfg.tabla}.id) AS duenos`;

  router.get("/", authMiddleware, async (req, res) => {
    try {
      if (req.query.pagina !== undefined) {
        const { pagina, limite, offset } = leerPaginacion(req.query);
        const { where, params } = filtroListado(cfg, req.query);
        const [rows] = await pool.query(`SELECT ${columnas} FROM ${cfg.tabla} ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limite, offset]);
        const [total] = await pool.query(`SELECT COUNT(*) AS total FROM ${cfg.tabla} ${where}`, params);
        return res.json({ [cfg.tabla]: rows, pagination: paginacion(pagina, limite, parseInt(total[0].total)) });
      }
      const q = String(req.query.q || "").trim();
      if (q) {
        const { where, params } = filtroBusqueda(cfg, q);
        const { orderBy, params: paramsOrden } = ordenBusqueda(cfg, q);
        const [rows] = await pool.query(`SELECT ${columnas} FROM ${cfg.tabla} ${where} ${orderBy} LIMIT ?`, [...params, ...paramsOrden, limiteSugerencias(req.query)]);
        return res.json(rows);
      }
      const [rows] = await pool.query(`SELECT ${columnas} FROM ${cfg.tabla} ORDER BY id DESC LIMIT 100`);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error del servidor" });
    }
  });

  return router;
}
