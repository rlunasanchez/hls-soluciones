// Generador del documento "Cotización" (HTML listo para imprimir/guardar como PDF).
// Función pura: no toca el DOM ni React. La impresión la dispara utils/imprimir.js.
// Mismo lenguaje visual que ordenServicioDoc.js (tarjetas, acento #0C4A8C).
import { EMPRESA, EMPRESA_RUT, EMPRESA_RAZON_SOCIAL, LOGO_HLS, DATOS_BANCARIOS, CONDICIONES_COTIZACION } from "./empresa";

const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]
));

const fecha = (v) => {
  const [y, m, d] = String(v ?? "").substring(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
};

const clp = (n) => Math.round(Number(n) || 0).toLocaleString("es-CL");

const campo = (label, valor) => (
  valor ? `<div class="f"><span class="l">${esc(label)}</span><span class="v">${esc(valor)}</span></div>` : ""
);

const slotLogo = (src, alt, cls) => (
  src
    ? `<img class="logo ${cls}" src="${src}" alt="${esc(alt)}">`
    : `<div class="logo ${cls} logo--ph">${esc(alt)}</div>`
);

const parseJsonArray = (val) => {
  if (Array.isArray(val)) return val;
  try {
    const arr = JSON.parse(val || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

// Exportado para que el formulario calcule los mismos totales que el PDF
// (una sola fuente de verdad para Neto/IVA/Total). Sin filtrar por "detalle":
// una fila con Neto cargado debe sumar aunque todavía no se haya escrito el
// detalle (se está completando el formulario de arriba hacia abajo).
export function calcularTotales(items) {
  const lista = parseJsonArray(items);
  const neto = lista.reduce((acc, i) => acc + (Number(i.cantidad) || 0) * (Number(i.neto) || 0), 0);
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;
  return { neto, iva, total };
}

function filaItem(item) {
  const cantidad = Number(item.cantidad) || 0;
  const neto = Number(item.neto) || 0;
  const total = cantidad * neto;
  return `
    <tr>
      <td class="sku">${item.sku ? esc(item.sku) : "-"}</td>
      <td class="detalle">${esc(item.detalle)}</td>
      <td class="num">${cantidad || ""}</td>
      <td class="num">${item.unidad ? esc(item.unidad) : ""}</td>
      <td class="num">${clp(neto)}</td>
      <td class="num">${clp(total)}</td>
    </tr>`;
}

const ESTILOS = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1F2937;
  font-size: 9pt;
  line-height: 1.28;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page { width: 210mm; min-height: 297mm; padding: 9mm 12mm 8mm; background: #EEF2F7; }

.enc { display: grid; grid-template-columns: 24mm 1fr auto; align-items: center; gap: 5mm; break-inside: avoid; }
.logo { display: flex; align-items: center; justify-content: center; }
.logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
.logo-hls { width: 24mm; height: 24mm; }
.logo--ph { border: .5pt dashed #CBD5E1; border-radius: 999px; color: #94A3B8; font-size: 6pt; text-align: center; padding: 2pt; }
.emp-datos { text-align: center; }
.emp-datos h1 { margin: 0; font-size: 13pt; font-weight: 800; letter-spacing: -.01em; color: #0C4A8C; }
.emp-datos p { margin: 1pt 0 0; font-size: 7pt; color: #6B7280; }

.folio-box { text-align: center; background: #FFFFFF; border: 1pt solid #0C4A8C; border-radius: 7pt; padding: 3mm 6mm; }
.folio-box h1 { margin: 0 0 1mm; font-size: 13pt; font-weight: 800; letter-spacing: .04em; color: #0C4A8C; }
.folio-box .folio-n { font-size: 9pt; font-weight: 700; color: #111827; }
.folio-box .rut-emp { margin-top: 1mm; font-size: 8pt; color: #374151; }
.folio-box .razon-emp { font-size: 8pt; font-weight: 700; color: #374151; }

.sec { margin-top: 3mm; break-inside: avoid; background: #FFFFFF; border: .5pt solid #E2E8F0; border-radius: 7pt; padding: 2.5mm 4mm; box-shadow: 0 1px 4px rgba(15,23,42,.15); }

.cliente-head { text-align: center; font-weight: 800; font-size: 9pt; color: #111827; margin-bottom: 2mm; }
.cliente-head .rut { font-weight: 700; color: #0C4A8C; margin-right: 6pt; }

.grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8mm; row-gap: 2mm; }
.f .l { display: block; font-size: 6pt; text-transform: uppercase; letter-spacing: .07em; color: #6B7280; }
.f .v { display: block; padding-bottom: 1mm; border-bottom: .5pt solid #E2E8F0; font-size: 9pt; font-weight: 600; color: #111827; overflow-wrap: anywhere; }

table.items { width: 100%; border-collapse: collapse; margin-top: 1mm; }
table.items thead th { text-align: left; font-size: 7pt; text-transform: uppercase; letter-spacing: .06em; color: #6B7280; border-bottom: 1pt solid #0C4A8C; padding: 2mm 2mm 1.5mm; }
table.items thead th.num { text-align: right; }
table.items td { padding: 2mm; border-bottom: .5pt solid #E2E8F0; vertical-align: top; }
table.items td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
table.items td.sku { color: #6B7280; white-space: nowrap; }
table.items td.detalle { font-weight: 600; color: #111827; white-space: pre-wrap; }

.pie-tabla { display: flex; gap: 6mm; margin-top: 3mm; }
.legales { flex: 1 1 auto; font-size: 6.5pt; color: #6B7280; }
.legales p { margin: 0; }
.totales { flex: 0 0 55mm; }
.totales .fila { display: flex; justify-content: space-between; padding: 1.2mm 0; font-size: 8.5pt; }
.totales .fila.total { border-top: 1pt solid #0C4A8C; margin-top: 1mm; padding-top: 2mm; font-weight: 800; font-size: 10pt; color: #0C4A8C; }
.totales .fila span:last-child { font-variant-numeric: tabular-nums; }

.bancarios { margin-top: 3mm; font-size: 7.5pt; color: #374151; }
.bancarios b { color: #111827; }
`;

export function generarHtmlCotizacion(cot) {
  const items = parseJsonArray(cot.items).filter((i) => String(i?.detalle || "").trim());
  const { neto, iva, total } = calcularTotales(cot.items);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${esc(tituloDocumentoCotizacion(cot))}</title>
<style>${ESTILOS}</style>
</head>
<body>
  <div class="page">

  <div class="enc">
    ${slotLogo(LOGO_HLS, "HLS", "logo-hls")}
    <div class="emp-datos">
      <h1>${esc(EMPRESA.nombre)}</h1>
      <p>${esc(EMPRESA.direccion)}</p>
      <p>${esc(EMPRESA.fono)}</p>
    </div>
    <div class="folio-box">
      <h1>COTIZACIÓN</h1>
      <div class="folio-n">Folio N° ${esc(cot.folio)}</div>
      <div class="rut-emp">${esc(EMPRESA_RUT)}</div>
      <div class="razon-emp">${esc(EMPRESA_RAZON_SOCIAL)}</div>
    </div>
  </div>

  <div class="sec">
    <div class="cliente-head">
      ${cot.cliente_rut ? `<span class="rut">${esc(cot.cliente_rut)}</span>` : ""}
      <span>${esc(cot.cliente_razon_social)}</span>
    </div>
    <div class="grid">
      ${campo("Contacto", cot.contacto_nombre)}
      ${campo("Ejecutivo", cot.ejecutivo)}
      ${campo("Fono Contacto", cot.contacto_fono)}
      ${campo("Fono Ejecutivo", cot.ejecutivo_fono)}
      ${campo("Email Contacto", cot.contacto_email)}
      ${campo("Email Ejecutivo", cot.ejecutivo_email)}
      ${campo("Condición", cot.condicion)}
      ${campo("País", cot.pais)}
      ${campo("Emisión", fecha(cot.fecha_emision))}
      ${campo("Válido hasta", fecha(cot.fecha_valido_hasta))}
    </div>
    ${cot.glosa ? `<div class="grid" style="margin-top:2mm"><div class="f" style="grid-column: 1 / -1"><span class="l">Glosa</span><span class="v">${esc(cot.glosa)}</span></div></div>` : ""}
  </div>

  <div class="sec">
    <table class="items">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Detalle</th>
          <th class="num">Cant.</th>
          <th class="num">Uni.</th>
          <th class="num">Neto</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(filaItem).join("")}
      </tbody>
    </table>
    <div class="pie-tabla">
      <div class="legales">
        ${CONDICIONES_COTIZACION.map((t) => `<p>${esc(t)}</p>`).join("")}
      </div>
      <div class="totales">
        <div class="fila"><span>Neto:</span><span>${clp(neto)} CLP</span></div>
        <div class="fila"><span>IVA (19%):</span><span>${clp(iva)} CLP</span></div>
        <div class="fila total"><span>Total:</span><span>${clp(total)} CLP</span></div>
      </div>
    </div>
  </div>

  <div class="sec bancarios">
    <b>Datos Bancarios:</b> ${esc(DATOS_BANCARIOS.tipoCuenta)} del ${esc(DATOS_BANCARIOS.banco)}, N° ${esc(DATOS_BANCARIOS.numero)}
    a nombre de ${esc(DATOS_BANCARIOS.titular)}; Email: ${esc(EMPRESA.email)}; RUT ${esc(EMPRESA_RUT)}
  </div>

  </div>
</body>
</html>`;
}

export function tituloDocumentoCotizacion(cot) {
  const cliente = String(cot.cliente_razon_social || "").trim();
  return `COTIZACIÓN ${cot.folio ?? "SIN-FOLIO"}${cliente ? " - " + cliente : ""}`;
}
