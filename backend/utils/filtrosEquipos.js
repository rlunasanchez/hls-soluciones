// Filtros del listado y del buscador de Equipos (se resuelven en el servidor).
// Idéntico en `main` (MySQL) y en `deploy/cloud` (PostgreSQL): usa marcadores "?" y `numerarMarcadores`
// (de filtrosOrdenes.js) los convierte a $1, $2… solo en PostgreSQL.
import { comoLike, escaparLike } from "./filtrosOrdenes.js";

// Listado de Equipos: ?modelo= (el modelo contiene el texto, sin distinguir mayúsculas)
export function filtrosListadoEquipos(query) {
  const modelo = String(query.modelo || "").trim();
  if (!modelo) return { where: "", params: [] };
  return { where: "WHERE LOWER(modelo) LIKE LOWER(?)", params: [comoLike(modelo)] };
}

// Buscador por texto (?q=): código, serie, equipo, marca o modelo contienen el texto.
export function filtrosBusquedaEquipos(q) {
  const termino = comoLike(q);
  return {
    where: "WHERE (LOWER(codigo) LIKE LOWER(?) OR LOWER(serie) LIKE LOWER(?) OR LOWER(equipo) LIKE LOWER(?) OR LOWER(marca) LIKE LOWER(?) OR LOWER(modelo) LIKE LOWER(?))",
    params: [termino, termino, termino, termino, termino]
  };
}

// Orden de las sugerencias: primero los equipos cuyo modelo empieza con el texto, luego los que lo
// contienen y al final el resto (marca, equipo, código o serie), del más nuevo al más antiguo.
export function ordenSugerenciasEquipos(q) {
  return {
    orderBy: "ORDER BY CASE WHEN LOWER(modelo) LIKE LOWER(?) THEN 0 WHEN LOWER(modelo) LIKE LOWER(?) THEN 1 ELSE 2 END, id DESC",
    params: [`${escaparLike(q)}%`, comoLike(q)]
  };
}

// Cantidad de sugerencias del buscador: por defecto 20, máximo 50.
export const leerLimiteSugerencias = (query) => Math.min(Math.max(parseInt(query.limite, 10) || 20, 1), 50);
