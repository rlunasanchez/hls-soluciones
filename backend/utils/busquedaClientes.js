// Búsqueda de clientes en el servidor (buscador de cliente de la OT). Idéntico en `main` (MySQL)
// y en `deploy/cloud` (PostgreSQL): usa "?" y `numerarMarcadores` (de filtrosOrdenes.js) los
// convierte a $1, $2… solo en PostgreSQL.
import { comoLike } from "./filtrosOrdenes.js";

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
