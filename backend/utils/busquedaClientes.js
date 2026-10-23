// Búsqueda de clientes en el servidor (buscador de cliente de la OT). Idéntico en `main` (MySQL)
// y en `deploy/cloud` (PostgreSQL): usa "?" y `numerarMarcadores` (de filtrosOrdenes.js) los
// convierte a $1, $2… solo en PostgreSQL.
import { comoLike, escaparLike } from "./filtrosOrdenes.js";

export const MIN_BUSQUEDA = 2;

// Cantidad de resultados: por defecto 10, máximo 50.
export const leerLimiteBusqueda = (query) => Math.min(Math.max(parseInt(query.limite, 10) || 10, 1), 50);

// WHERE para buscar por razón social, código (CL-0001) o, si el texto parte con un número, por
// los dígitos del RUT (ignora puntos, guion y DV: "14900" encuentra "14.900.665-6").
export function buscarClientesSql(q) {
  const texto = String(q || "").trim();
  const condiciones = ["LOWER(razon_social) LIKE LOWER(?)", "LOWER(codigo) LIKE LOWER(?)"];
  const params = [comoLike(texto), comoLike(texto)];
  const digitos = texto.replace(/[^0-9]/g, "");
  if (/^[0-9]/.test(texto) && digitos) {
    condiciones.push("REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', '') LIKE ?");
    params.push(`%${digitos}%`);
  }
  return { where: `WHERE (${condiciones.join(" OR ")})`, params };
}

// Filtros del listado de Clientes (con paginación en el servidor): ?nombre=&rut=
//  - nombre: la razón social empieza con el texto o alguna de sus palabras empieza con él.
//  - rut: solo los dígitos, desde el comienzo ("14900" encuentra "14.900.665-6"; se ignoran puntos, guion y DV).
export function filtrosListadoClientes(query) {
  const condiciones = [];
  const params = [];
  const nombre = String(query.nombre || "").trim();
  if (nombre) {
    condiciones.push("(LOWER(razon_social) LIKE LOWER(?) OR LOWER(razon_social) LIKE LOWER(?))");
    params.push(`${escaparLike(nombre)}%`, `% ${escaparLike(nombre)}%`);
  }
  const digitos = String(query.rut || "").replace(/[^0-9]/g, "");
  if (digitos) {
    condiciones.push("REPLACE(REPLACE(REPLACE(REPLACE(UPPER(rut), '.', ''), '-', ''), ' ', ''), 'K', '') LIKE ?");
    params.push(`${digitos}%`);
  }
  return { where: condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "", params };
}
