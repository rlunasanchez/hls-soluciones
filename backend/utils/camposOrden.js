// Campos de una orden de trabajo y armado de su INSERT / UPDATE a partir de una sola lista.
// Para agregar o quitar una columna basta editar CAMPOS (ya no hay que contar marcadores a mano).
// Este archivo es idéntico en `main` (MySQL) y en `deploy/cloud` (PostgreSQL): el SQL usa "?" y
// `numerarMarcadores` (de filtrosOrdenes.js) los vuelve $1, $2… solo en PostgreSQL.

export const toDateMySQL = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
};

// Conversiones de cada dato del formulario al valor que se guarda
const tal = (v) => v;                                   // obligatorios: se guardan tal cual
const texto = (v) => v || null;                         // vacío -> NULL
const marca = (v) => v || false;                        // casilla -> false si no viene
const fecha = toDateMySQL;
const listaJson = (v) => (v && v.length ? JSON.stringify(v) : null);   // adjuntos
const objetoJson = (v) => (v ? JSON.stringify(v) : null);              // contactos / direcciones extra
const tipoCliente = (v) => (v === "PERSONA" ? "PERSONA" : "EMPRESA");

// [columna de la base, clave que llega del formulario, conversión]. El orden es el del INSERT.
// La OT se vincula al cliente SOLO si se eligió del buscador (clienteId); si se escribió a mano
// los datos quedan solo en la OT.
export const CAMPOS = [
  ["fecha", "fecha", fecha],
  ["es_garantia", "esGarantia", marca],
  ["fecha_ingreso", "fechaIngreso", fecha],
  ["fecha_ingreso_check", "fechaIngresoCheck", marca],
  ["fecha_termino", "fechaTermino", fecha],
  ["fecha_termino_check", "fechaTerminoCheck", marca],
  ["fecha_entrega", "fechaEntrega", fecha],
  ["fecha_entrega_check", "fechaEntregaCheck", marca],
  ["fecha_compra", "fechaCompra", fecha],
  ["fecha_compra_check", "fechaCompraCheck", marca],
  ["cliente", "cliente", tal],
  ["direccion", "direccion", texto],
  ["ciudad", "ciudad", texto],
  ["comuna", "comuna", texto],
  ["rut", "rut", texto],
  ["contacto", "contacto", texto],
  ["fono_contacto", "fonoContacto", texto],
  ["email_contacto", "emailContacto", texto],
  ["cargo_contacto", "cargoContacto", texto],
  ["fono_principal", "fonoPrincipal", texto],
  ["email", "email", texto],
  ["tecnico_asignado", "tecnicoAsignado", tal],
  ["equipo", "equipo", tal],
  ["modelo", "modelo", tal],
  ["marca", "marca", tal],
  ["serie", "serie", texto],
  ["contador_pag_out", "contadorPagOut", texto],
  ["nivel_tinta", "nivelTinta", texto],
  ...Array.from({ length: 12 }, (_, i) => [`insumo${i + 1}`, `insumo${i + 1}`, texto]),
  ["averia", "averia", texto],
  ["actividad", "actividad", texto],
  ["observaciones", "observaciones", texto],
  ["info_interna", "infoInterna", texto],
  ["adjunto", "adjuntos", listaJson],
  ["contactos_extra", "contactosExtra", objetoJson],
  ["direcciones_extra", "direccionesExtra", objetoJson],
  ["cliente_id", "clienteId", texto],
  ["cliente_tipo", "clienteTipo", tipoCliente],
];

const valores = (body) => CAMPOS.map(([, clave, convertir]) => convertir(body[clave]));

// INSERT de una orden nueva (el número de orden va primero). Devuelve { sql, params }.
export function armarInsertOrden(body, numeroOrden) {
  const columnas = ["numero_orden", ...CAMPOS.map(([columna]) => columna)];
  return {
    sql: `INSERT INTO ordenes_trabajo (${columnas.join(", ")}) VALUES (${columnas.map(() => "?").join(", ")})`,
    params: [numeroOrden, ...valores(body)],
  };
}

// UPDATE de una orden existente. Devuelve { sql, params }.
export function armarUpdateOrden(body, id) {
  return {
    sql: `UPDATE ordenes_trabajo SET ${CAMPOS.map(([columna]) => `${columna} = ?`).join(", ")} WHERE id = ?`,
    params: [...valores(body), id],
  };
}
