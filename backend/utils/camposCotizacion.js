// Campos de una cotización y armado de su INSERT / UPDATE a partir de una sola lista (como camposOrden.js).
// El cliente, el contacto y la dirección usan las MISMAS columnas que la OT. Los ítems van en la tabla
// cotizacion_items y los montos en columnas (neto, iva, total): nada se guarda como JSON.
// Este archivo es idéntico en `main` (MySQL) y en `deploy/cloud` (PostgreSQL): el SQL usa "?" y
// `numerarMarcadores` (de filtrosOrdenes.js) los vuelve $1, $2… solo en PostgreSQL.

const tal = (v) => v;                                   // obligatorios: se guardan tal cual
const texto = (v) => v || null;                         // vacío -> NULL
const obligatorio = (v) => v || "";                     // NOT NULL sin valor -> cadena vacía
const tipoCliente = (v) => (v === "PERSONA" ? "PERSONA" : "EMPRESA");

// [columna de la base, clave que llega del formulario, conversión]. El orden es el del INSERT.
// Los vínculos (cliente_id, contacto_id, direccion_id) los resuelve el servidor al guardar.
export const CAMPOS = [
  ["fecha_emision", "fechaEmision", tal],
  ["fecha_valido_hasta", "fechaValidoHasta", texto],
  ["condicion", "condicion", texto],
  ["glosa", "glosa", texto],
  ["cliente", "cliente", obligatorio],
  ["rut", "rut", texto],
  ["fono_principal", "fonoPrincipal", texto],
  ["email", "email", texto],
  ["cliente_tipo", "clienteTipo", tipoCliente],
  ["cliente_id", "clienteId", texto],
  ["contacto", "contacto", texto],
  ["fono_contacto", "fonoContacto", texto],
  ["email_contacto", "emailContacto", texto],
  ["cargo_contacto", "cargoContacto", texto],
  ["contacto_id", "contactoId", texto],
  ["direccion", "direccion", texto],
  ["ciudad", "ciudad", texto],
  ["comuna", "comuna", texto],
  ["direccion_id", "direccionId", texto],
  ["ejecutivo", "ejecutivo", texto],
  ["ejecutivo_fono", "ejecutivoFono", texto],
  ["ejecutivo_email", "ejecutivoEmail", texto],
  ["neto", "neto", tal],
  ["iva_porcentaje", "ivaPorcentaje", tal],
  ["iva", "iva", tal],
  ["total", "total", tal],
  ["orden_id", "ordenId", texto],
  ["orden_numero", "ordenNumero", texto],
];

const valores = (body) => CAMPOS.map(([, clave, convertir]) => convertir(body[clave]));

// INSERT de una cotización nueva (el folio va primero). Devuelve { sql, params }.
export function armarInsertCotizacion(body, folio) {
  const columnas = ["folio", ...CAMPOS.map(([columna]) => columna)];
  return {
    sql: `INSERT INTO cotizaciones (${columnas.join(", ")}) VALUES (${columnas.map(() => "?").join(", ")})`,
    params: [folio, ...valores(body)],
  };
}

// UPDATE de una cotización existente. Devuelve { sql, params }.
export function armarUpdateCotizacion(body, id) {
  return {
    sql: `UPDATE cotizaciones SET ${CAMPOS.map(([columna]) => `${columna} = ?`).join(", ")} WHERE id = ?`,
    params: [...valores(body), id],
  };
}
