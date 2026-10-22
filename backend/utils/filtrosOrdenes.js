// Filtros y paginación del listado de órdenes de trabajo (se resuelven en el servidor).
// Este archivo es idéntico en `main` (MySQL) y en `deploy/cloud` (PostgreSQL): usa
// marcadores "?" y `numerarMarcadores` los convierte a $1, $2… solo para PostgreSQL.

const LIMITE_MAXIMO = 100;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// Escapa % _ \ para que el texto buscado se tome literal dentro de un LIKE.
export const comoLike = (texto) => `%${String(texto).trim().replace(/[\\%_]/g, "\\$&")}%`;

// Página y límite desde la consulta (acepta pagina/limite y los antiguos page/limit).
export function leerPaginacion(query) {
  const pagina = Math.max(parseInt(query.pagina ?? query.page, 10) || 1, 1);
  const limite = Math.min(Math.max(parseInt(query.limite ?? query.limit, 10) || 10, 1), LIMITE_MAXIMO);
  return { pagina, limite, offset: (pagina - 1) * limite };
}

// Arma el WHERE a partir de los filtros del listado. Devuelve { where, params }.
export function filtrosOrdenes(query) {
  const condiciones = [];
  const params = [];
  const contiene = (columna, valor) => {
    if (!valor || !String(valor).trim()) return;
    condiciones.push(`LOWER(${columna}) LIKE LOWER(?)`);
    params.push(comoLike(valor));
  };

  contiene("numero_orden", query.numero);
  contiene("cliente", query.cliente);
  contiene("serie", query.serie);

  // Estado: cerrada = tiene fecha de entrega; pendiente = no la tiene
  if (query.estado === "cerrada") condiciones.push("fecha_entrega IS NOT NULL");
  if (query.estado === "pendiente") condiciones.push("fecha_entrega IS NULL");

  // Garantía: IS TRUE / IS NOT TRUE funcionan igual en MySQL y PostgreSQL (NULL cuenta como "no")
  if (query.garantia === "si") condiciones.push("es_garantia IS TRUE");
  if (query.garantia === "no") condiciones.push("es_garantia IS NOT TRUE");

  if (FECHA.test(query.desde || "")) { condiciones.push("fecha >= ?"); params.push(query.desde); }
  if (FECHA.test(query.hasta || "")) { condiciones.push("fecha <= ?"); params.push(query.hasta); }

  return { where: condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "", params };
}

// Solo PostgreSQL: cambia cada "?" por $1, $2… en orden.
export function numerarMarcadores(sql) {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}
