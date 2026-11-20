// Montos de una cotización: los calcula el SERVIDOR al guardar y quedan en columnas (cotizacion_items.total y
// cotizaciones.neto / iva / total). El formulario solo muestra una vista previa con la misma regla
// (frontend/src/utils/cotizacionDoc.js, `calcularTotales`): si se cambia una, hay que cambiar la otra.
// Este archivo es idéntico en `main` (MySQL) y en `deploy/cloud` (PostgreSQL).
//
// Reglas (todo en pesos enteros):
//  - total del ítem = cantidad × neto × (1 − descuento%), redondeado.
//  - neto de la cotización = suma de los totales de los ítems.
//  - IVA = neto × porcentaje (19 por defecto), redondeado. Total = neto + IVA.

export const IVA_PORCENTAJE = 19;

const num = (v) => Number(v) || 0;

export function calcularItem(item) {
  const cantidad = Math.max(0, num(item.cantidad));
  const neto = Math.max(0, Math.round(num(item.neto)));
  const descuento = Math.min(100, Math.max(0, num(item.descuento)));
  return {
    sku: String(item.sku ?? "").trim(),
    detalle: String(item.detalle ?? "").trim(),
    cantidad,
    neto,
    descuento,
    total: Math.round(cantidad * neto * (1 - descuento / 100)),
  };
}

// Solo se guardan los ítems con algo escrito (SKU, detalle o neto).
const tieneDatos = (i) => i.sku || i.detalle || i.neto > 0;

export function calcularMontos(items, ivaPorcentaje = IVA_PORCENTAJE) {
  const lineas = (Array.isArray(items) ? items : []).map(calcularItem).filter(tieneDatos);
  const neto = lineas.reduce((suma, i) => suma + i.total, 0);
  const iva = Math.round((neto * ivaPorcentaje) / 100);
  return { items: lineas, neto, iva, total: neto + iva, ivaPorcentaje };
}
