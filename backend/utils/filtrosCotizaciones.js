// Filtros del listado de Cotizaciones (se resuelven en el servidor).
// Idéntico en `main` (MySQL) y en `deploy/cloud` (PostgreSQL): usa marcadores "?" y `numerarMarcadores`
// (de filtrosOrdenes.js) los convierte a $1, $2… solo en PostgreSQL. CONCAT('', folio) vuelve texto el folio
// (número) en los dos motores, para buscar "contiene".
import { comoLike } from "./filtrosOrdenes.js";

// ?folio= (el folio contiene el texto), ?cliente= (el cliente contiene el texto, sin distinguir mayúsculas)
// y ?orden_id= (las cotizaciones de una OT). Devuelve { where, params }.
export function filtrosCotizaciones(query) {
  const condiciones = [];
  const params = [];

  const folio = String(query.folio || "").trim();
  if (folio) { condiciones.push("CONCAT('', folio) LIKE ?"); params.push(comoLike(folio)); }

  const cliente = String(query.cliente || "").trim();
  if (cliente) { condiciones.push("LOWER(cliente) LIKE LOWER(?)"); params.push(comoLike(cliente)); }

  const ordenId = parseInt(query.orden_id, 10);
  if (ordenId) { condiciones.push("orden_id = ?"); params.push(ordenId); }

  return { where: condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "", params };
}
