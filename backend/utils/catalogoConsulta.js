// Consulta compartida de los catálogos Contactos y Direcciones (listado paginado en el servidor y buscador).
// Cada catálogo se describe con una configuración (tabla, vínculo con clientes y columnas por las que se busca);
// el SQL y la paginación son los mismos, así que no se repiten en contactos.js y direcciones.js.
import { comoLike, escaparLike } from "./filtrosOrdenes.js";

const LIMITE_SUGERENCIAS = 50;

// Contactos y Direcciones: `filtro` es la columna del filtro del listado (?nombre= / ?direccion=) y
// `busqueda` las columnas donde busca el texto (?q=) del buscador de la OT, la cotización y la ficha del cliente.
export const CATALOGOS = {
  contactos: {
    tabla: "contactos", vinculo: "cliente_contactos", columnaVinculo: "contacto_id",
    filtro: "nombre", busqueda: ["codigo", "nombre", "email", "fono", "cargo"]
  },
  direcciones: {
    tabla: "direcciones", vinculo: "cliente_direcciones", columnaVinculo: "direccion_id",
    filtro: "direccion", busqueda: ["codigo", "direccion", "ciudad", "comuna"]
  }
};

// Filtro del listado: la columna principal contiene el texto, sin distinguir mayúsculas.
export function filtroListado(cfg, query) {
  const texto = String(query[cfg.filtro] || "").trim();
  if (!texto) return { where: "", params: [] };
  return { where: `WHERE LOWER(${cfg.filtro}) LIKE LOWER(?)`, params: [comoLike(texto)] };
}

// Buscador (?q=): alguna de las columnas de búsqueda contiene el texto.
export function filtroBusqueda(cfg, q) {
  const termino = comoLike(q);
  return {
    where: `WHERE (${cfg.busqueda.map((c) => `LOWER(${c}) LIKE LOWER(?)`).join(" OR ")})`,
    params: cfg.busqueda.map(() => termino)
  };
}

// Orden de las sugerencias: primero los que empiezan con el texto, luego los que lo contienen.
export function ordenBusqueda(cfg, q) {
  return {
    orderBy: `ORDER BY CASE WHEN LOWER(${cfg.filtro}) LIKE LOWER(?) THEN 0 ELSE 1 END, id DESC`,
    params: [`${escaparLike(q)}%`]
  };
}

export const limiteSugerencias = (query) => Math.min(Math.max(parseInt(query.limite, 10) || 20, 1), LIMITE_SUGERENCIAS);

export const paginacion = (pagina, limite, totalItems) =>
  ({ currentPage: pagina, totalPages: Math.ceil(totalItems / limite), totalItems, itemsPerPage: limite });
