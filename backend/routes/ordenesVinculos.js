// Vínculo de la OT con el mantenedor de Equipos, Contactos y Direcciones (como ya lo tiene con el cliente):
// la OT guarda el id (`equipo_id`, `contacto_id`, `direccion_id`) además de la copia de los textos.
//  - Al guardar la OT, `resolverVinculos` enlaza cada dato con el registro del mantenedor que lo identifica:
//    equipo = Equipo + Marca + Modelo, contacto = su nombre, dirección = su texto (sin distinguir mayúsculas
//    ni espacios, igual que al detectar repetidos). Lo escrito a mano que no existe queda sin vínculo.
//  - Al editar un registro del mantenedor, `sincronizar*` actualiza los textos en todas las OT vinculadas
//    (del equipo: Equipo, Marca y Modelo; la serie es de cada OT y no se toca).
//  - Al eliminarlo, `desvincular` deja las OT con su copia y sin vínculo.
const norm = (v) => String(v ?? "").trim();

async function idDe(db, sql, params) {
  const [rows] = await db.query(sql, params);
  return rows[0]?.id ?? null;
}

// Ids del mantenedor que corresponden a los datos de la OT (cada uno es null si no hay coincidencia).
export async function resolverVinculos(db, orden) {
  const equipo = norm(orden.equipo), contacto = norm(orden.contacto), direccion = norm(orden.direccion);
  return {
    equipoId: equipo ? await idDe(db,
      `SELECT id FROM equipos WHERE LOWER(TRIM(equipo)) = LOWER(?) AND LOWER(TRIM(IFNULL(marca,''))) = LOWER(?) AND LOWER(TRIM(IFNULL(modelo,''))) = LOWER(?) ORDER BY id LIMIT 1`,
      [equipo, norm(orden.marca), norm(orden.modelo)]) : null,
    contactoId: contacto ? await idDe(db, `SELECT id FROM contactos WHERE LOWER(TRIM(nombre)) = LOWER(?) ORDER BY id LIMIT 1`, [contacto]) : null,
    direccionId: direccion ? await idDe(db, `SELECT id FROM direcciones WHERE LOWER(TRIM(direccion)) = LOWER(?) ORDER BY id LIMIT 1`, [direccion]) : null,
  };
}

export const sincronizarOrdenesDeEquipo = (db, id, e) => db.query(
  "UPDATE ordenes_trabajo SET equipo = ?, marca = ?, modelo = ? WHERE equipo_id = ?", [e.equipo, e.marca || "", e.modelo || "", id]);

export const sincronizarOrdenesDeContacto = (db, id, c) => db.query(
  "UPDATE ordenes_trabajo SET contacto = ?, fono_contacto = ?, email_contacto = ?, cargo_contacto = ? WHERE contacto_id = ?",
  [c.nombre, c.fono || null, c.email || null, c.cargo || null, id]);

export const sincronizarOrdenesDeDireccion = (db, id, d) => db.query(
  "UPDATE ordenes_trabajo SET direccion = ?, ciudad = ?, comuna = ? WHERE direccion_id = ?", [d.direccion, d.ciudad || null, d.comuna || null, id]);

// Tras crear un registro del mantenedor: las OT sin vínculo cuyo texto lo identifica quedan enlazadas a él
// (p. ej. se eliminó un equipo y se volvió a registrar: todas sus OT lo recuperan sin abrirlas una a una).
export const reenlazarOrdenesDeEquipo = (db, id, e) => db.query(
  `UPDATE ordenes_trabajo SET equipo_id = ? WHERE equipo_id IS NULL AND LOWER(TRIM(equipo)) = LOWER(?)
   AND LOWER(TRIM(IFNULL(marca,''))) = LOWER(?) AND LOWER(TRIM(IFNULL(modelo,''))) = LOWER(?)`,
  [id, norm(e.equipo), norm(e.marca), norm(e.modelo)]);

export const reenlazarOrdenesDeContacto = (db, id, nombre) => db.query(
  "UPDATE ordenes_trabajo SET contacto_id = ? WHERE contacto_id IS NULL AND LOWER(TRIM(contacto)) = LOWER(?)", [id, norm(nombre)]);

export const reenlazarOrdenesDeDireccion = (db, id, direccion) => db.query(
  "UPDATE ordenes_trabajo SET direccion_id = ? WHERE direccion_id IS NULL AND LOWER(TRIM(direccion)) = LOWER(?)", [id, norm(direccion)]);

// Tras eliminar un registro del mantenedor: las OT conservan su copia y pierden el vínculo.
const COLUMNA = { equipo: "equipo_id", contacto: "contacto_id", direccion: "direccion_id" };
export const desvincularOrdenes = (db, tipo, id) => {
  if (!COLUMNA[tipo]) throw new Error(`Tipo de vínculo desconocido: ${tipo}`);
  return db.query(`UPDATE ordenes_trabajo SET ${COLUMNA[tipo]} = NULL WHERE ${COLUMNA[tipo]} = ?`, [id]);
};
