// Adjuntos de la OT: límites, validación previa a subir, reducción de imágenes y miniaturas.
// Los límites son los mismos que valida el servidor (backend/utils/limitesAdjuntos.js).

export const LIMITES = {
  maxImagenes: 10,
  maxPdfs: 10,
  maxBytesImagen: 5 * 1024 * 1024,
  maxBytesPdf: 10 * 1024 * 1024,
  maxBytesTotal: 60 * 1024 * 1024,
};

const LADO_MAXIMO = 1600;          // las imágenes más grandes se reducen a este lado mayor
const REDUCIR_DESDE = 1.5 * 1024 * 1024;
const LADO_MINIATURA = 96;

export const esPdf = (tipo) => tipo === "application/pdf";
export const esImagen = (tipo) => ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"].includes(tipo);

export const formatoTamano = (bytes) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// data URL de un adjunto que aún no está en el servidor (pendiente de una OT nueva o antiguo)
export const dataUrlDe = (item) => item.data || `data:${item.tipo};base64,${item.base64}`;

// Mensaje del primer problema para un archivo nuevo, o null. `existentes`: [{ tipo, tamano }].
export function validarArchivoNuevo(file, existentes) {
  if (!esPdf(file.type) && !esImagen(file.type)) return `"${file.name}": solo se permiten imágenes (JPG, PNG, GIF, WEBP, BMP) o PDF.`;
  const mb = (n) => Math.round(n / (1024 * 1024));
  if (esPdf(file.type)) {
    if (file.size > LIMITES.maxBytesPdf) return `"${file.name}": el PDF supera el máximo de ${mb(LIMITES.maxBytesPdf)} MB.`;
    if (existentes.filter((a) => esPdf(a.tipo)).length >= LIMITES.maxPdfs) return `Máximo ${LIMITES.maxPdfs} PDF por orden.`;
  } else {
    // Las imágenes grandes se reducen solas antes de subir; solo se rechaza lo absurdamente grande
    if (file.size > 40 * 1024 * 1024) return `"${file.name}": la imagen es demasiado grande.`;
    if (existentes.filter((a) => esImagen(a.tipo)).length >= LIMITES.maxImagenes) return `Máximo ${LIMITES.maxImagenes} imágenes por orden.`;
  }
  return null;
}

const leerComoDataUrl = (blob) => new Promise((resolve, reject) => {
  const lector = new FileReader();
  lector.onload = () => resolve(lector.result);
  lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
  lector.readAsDataURL(blob);
});

const cargarImagen = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("No se pudo leer la imagen."));
  img.src = src;
});

// Dibuja la imagen reducida (lado mayor <= lado) sobre fondo blanco y la devuelve como data URL JPEG.
function aJpeg(img, lado, calidad) {
  const escala = Math.min(1, lado / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * escala));
  canvas.height = Math.max(1, Math.round(img.height * escala));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", calidad);
}

const base64De = (dataUrl) => dataUrl.slice(dataUrl.indexOf(",") + 1);
const bytesDeBase64 = (b64) => Math.floor((b64.length * 3) / 4) - (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0);

// Miniatura (data URL JPEG chica) de una imagen dada como data URL; null si no se puede.
export async function miniaturaDe(dataUrl) {
  try {
    return aJpeg(await cargarImagen(dataUrl), LADO_MINIATURA, 0.7);
  } catch {
    return null;
  }
}

// Prepara un archivo para subir: { nombre, tipo, tamano, base64, miniatura }.
// Las imágenes grandes (más de 1,5 MB o de más de 1600 px) se reducen a JPEG; los GIF no se tocan
// para no perder la animación.
export async function prepararArchivo(file) {
  const dataUrl = await leerComoDataUrl(file);
  if (esPdf(file.type)) return { nombre: file.name, tipo: file.type, tamano: file.size, base64: base64De(dataUrl), miniatura: null };

  let tipo = file.type, nombre = file.name, base64 = base64De(dataUrl), miniatura = null;
  try {
    const img = await cargarImagen(dataUrl);
    const demasiado = file.size > REDUCIR_DESDE || Math.max(img.width, img.height) > LADO_MAXIMO;
    if (demasiado && tipo !== "image/gif") {
      const reducida = aJpeg(img, LADO_MAXIMO, 0.85);
      tipo = "image/jpeg";
      nombre = nombre.replace(/\.[^.]+$/, "") + ".jpg";
      base64 = base64De(reducida);
    }
    miniatura = aJpeg(img, LADO_MINIATURA, 0.7);
  } catch { /* sin miniatura: se mostrará un icono */ }
  return { nombre, tipo, tamano: bytesDeBase64(base64), base64, miniatura };
}

// Convierte un adjunto antiguo (JSON { nombre, tipo, data: dataURL }) al formato de subida.
export async function prepararAntiguo(antiguo) {
  const base64 = base64De(antiguo.data || "");
  const miniatura = esImagen(antiguo.tipo) ? await miniaturaDe(antiguo.data) : null;
  return { nombre: antiguo.nombre || "archivo", tipo: antiguo.tipo, tamano: bytesDeBase64(base64), base64, miniatura };
}
