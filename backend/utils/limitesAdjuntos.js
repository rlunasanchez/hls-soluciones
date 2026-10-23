// Límites y validación de los adjuntos de la OT. Idéntico en `main` (MySQL) y `deploy/cloud` (PostgreSQL).
// Los mismos números están en frontend/src/utils/adjuntos.js (para avisar antes de subir).

export const LIMITES = {
  maxImagenes: 10,
  maxPdfs: 10,
  maxBytesImagen: 5 * 1024 * 1024,
  maxBytesPdf: 10 * 1024 * 1024,
  maxBytesTotal: 60 * 1024 * 1024,
  maxMiniatura: 30000,           // caracteres del data URL de la miniatura
};

export const esPdf = (tipo) => tipo === "application/pdf";
export const esImagen = (tipo) => ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"].includes(tipo);

// Los primeros bytes del archivo deben corresponder al tipo declarado (evita pasar otra cosa como imagen o PDF).
export function coincideConTipo(buffer, tipo) {
  const texto = (desde, hasta) => buffer.subarray(desde, hasta).toString("latin1");
  if (tipo === "application/pdf") return texto(0, 4) === "%PDF";
  if (tipo === "image/jpeg") return buffer.subarray(0, 3).toString("hex") === "ffd8ff";
  if (tipo === "image/png") return buffer.subarray(0, 4).toString("hex") === "89504e47";
  if (tipo === "image/gif") return texto(0, 4) === "GIF8";
  if (tipo === "image/webp") return texto(0, 4) === "RIFF" && texto(8, 12) === "WEBP";
  if (tipo === "image/bmp") return texto(0, 2) === "BM";
  return false;
}

// Devuelve el mensaje del primer problema, o null si el archivo se puede agregar.
// `existentes`: lista de { tipo, tamano } de los adjuntos que ya tiene la orden.
export function validarNuevoAdjunto({ tipo, bytes }, existentes) {
  if (!esPdf(tipo) && !esImagen(tipo)) return "Solo se permiten imágenes (JPG, PNG, GIF, WEBP, BMP) o PDF.";
  if (bytes <= 0) return "El archivo está vacío.";
  const mb = (n) => Math.round(n / (1024 * 1024));
  if (esPdf(tipo)) {
    if (bytes > LIMITES.maxBytesPdf) return `El PDF supera el máximo de ${mb(LIMITES.maxBytesPdf)} MB.`;
    if (existentes.filter((a) => esPdf(a.tipo)).length >= LIMITES.maxPdfs) return `Máximo ${LIMITES.maxPdfs} PDF por orden.`;
  } else {
    if (bytes > LIMITES.maxBytesImagen) return `La imagen supera el máximo de ${mb(LIMITES.maxBytesImagen)} MB.`;
    if (existentes.filter((a) => esImagen(a.tipo)).length >= LIMITES.maxImagenes) return `Máximo ${LIMITES.maxImagenes} imágenes por orden.`;
  }
  const total = existentes.reduce((suma, a) => suma + Number(a.tamano), 0) + bytes;
  if (total > LIMITES.maxBytesTotal) return `Los adjuntos de la orden no pueden pasar de ${mb(LIMITES.maxBytesTotal)} MB en total.`;
  return null;
}
