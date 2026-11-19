// Generador del documento "Cotización" (HTML listo para imprimir/guardar como PDF).
// Función pura: no toca el DOM ni React. La impresión la dispara utils/imprimir.js.
// Mismo estilo que la Orden de Servicio (ordenServicioDoc.js): comparten pdfEstilos.js y pdfHelpers.js.
import { EMPRESA, EMPRESA_RUT, EMPRESA_RAZON_SOCIAL, LOGO_HLS, DATOS_BANCARIOS, CONDICIONES_COTIZACION } from "./empresa";
import { ESTILOS_COMUNES } from "./pdfEstilos";
import { esc, fecha, campo, h2, slotLogo, unir } from "./pdfHelpers";

const clp = (n) => Math.round(Number(n) || 0).toLocaleString("es-CL");

const parseJsonArray = (val) => {
  if (Array.isArray(val)) return val;
  try {
    const arr = JSON.parse(val || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

function contactoExtraHtml(c) {
  const direccion = unir([c.direccion, c.ciudad, c.comuna], ", ");
  const detalle = [c.cargo, c.fono, c.email, direccion].filter((v) => String(v || "").trim()).map(esc).join(" · ");
  return `<div class="extra-item"><span class="nom">${esc(c.nombre)}</span>${detalle ? ` <span class="det">${detalle}</span>` : ""}</div>`;
}

// Exportado para que el formulario calcule los mismos totales que el PDF
// (una sola fuente de verdad para Neto/IVA/Total). Sin filtrar por "detalle":
// una fila con Neto cargado debe sumar aunque todavía no se haya escrito el
// detalle (se está completando el formulario de arriba hacia abajo).
export function calcularTotales(items) {
  const lista = parseJsonArray(items);
  const neto = lista.reduce((acc, i) => {
    const bruto = (Number(i.cantidad) || 0) * (Number(i.neto) || 0);
    const descuentoPct = Math.min(100, Math.max(0, Number(i.descuento) || 0));
    return acc + Math.max(0, bruto * (1 - descuentoPct / 100));
  }, 0);
  const iva = Math.round(neto * 0.19);
  const total = neto + iva;
  return { neto, iva, total };
}

function filaItem(item) {
  const cantidad = Number(item.cantidad) || 0;
  const neto = Number(item.neto) || 0;
  const descuentoPct = Math.min(100, Math.max(0, Number(item.descuento) || 0));
  const total = Math.max(0, cantidad * neto * (1 - descuentoPct / 100));
  return `
    <tr>
      <td class="sku">${item.sku ? esc(item.sku) : "-"}</td>
      <td class="detalle">${esc(item.detalle)}</td>
      <td class="num">${cantidad || ""}</td>
      <td class="num">${clp(neto)}</td>
      <td class="num">${descuentoPct ? descuentoPct + "%" : ""}</td>
      <td class="num">${clp(total)}</td>
    </tr>`;
}

// Lo propio de la cotización, encima de los estilos comunes: cuadro de la empresa en el encabezado,
// contactos adicionales, tabla de ítems, condiciones, totales y datos bancarios.
const ESTILOS = `${ESTILOS_COMUNES}
.emp-rut { text-align: center; align-self: flex-end; }
.emp-rut .rs { font-size: 8pt; font-weight: 700; color: #374151; }
.emp-rut .rut { margin-top: .5mm; font-size: 6.5pt; font-weight: 700; color: #374151; }

.extra-item { margin-top: 1.2mm; overflow-wrap: anywhere; }
.extra-item .nom { font-size: 9pt; font-weight: 600; }
.extra-item .det { font-size: 9pt; font-weight: 600; color: #111827; }

table.items { width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 1mm; }
table.items thead th { text-align: left; font-size: 7pt; text-transform: uppercase; letter-spacing: .06em; color: #6B7280; border-bottom: 1pt solid #0C4A8C; padding: 2mm 2mm 1.5mm; }
table.items thead th.num { text-align: right; }
table.items th:nth-child(1), table.items td:nth-child(1) { width: 22mm; }
table.items th:nth-child(3), table.items td:nth-child(3) { width: 12mm; }
table.items th:nth-child(4), table.items td:nth-child(4) { width: 18mm; }
table.items th:nth-child(5), table.items td:nth-child(5) { width: 16mm; }
table.items th:nth-child(6), table.items td:nth-child(6) { width: 20mm; }
table.items td { padding: 2mm; border-bottom: .5pt solid #E2E8F0; vertical-align: top; overflow-wrap: anywhere; }
table.items td.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
table.items td.sku { color: #6B7280; font-size: 7.5pt; word-break: break-all; }
table.items td.detalle { font-weight: 600; color: #111827; white-space: pre-wrap; }

.pie-tabla { display: flex; gap: 6mm; margin-top: 3mm; }
.legales { flex: 1 1 auto; font-size: 6.5pt; color: #6B7280; }
.legales p { margin: 0; }
.cond-pie { margin-top: 4mm; grid-template-columns: 1fr 1fr 1fr; }
.totales { flex: 0 0 55mm; }
.totales .fila { display: flex; justify-content: space-between; padding: 1.2mm 0; font-size: 8.5pt; }
.totales .fila.total { border-top: 1pt solid #0C4A8C; margin-top: 1mm; padding-top: 2mm; font-weight: 800; font-size: 10pt; color: #0C4A8C; }
.totales .fila span:last-child { font-variant-numeric: tabular-nums; }

.bancarios { font-size: 9pt; color: #374151; }
.bancarios b { color: #111827; }
`;

// Exportado para que el modal de opciones de PDF liste los mismos contactos
// extra que terminará mostrando el documento (una sola fuente de verdad).
export function contactosExtraDe(cot) {
  return parseJsonArray(cot.contactos_extra).filter((c) => String(c?.nombre || "").trim());
}

// Secciones de cliente y contacto como en la OT: una empresa lleva su contacto y la dirección en la sección
// Contacto; una persona no tiene contacto y su dirección va en Datos de Cliente.
function seccionesCliente(cot, contactosExtra) {
  const esPersona = cot.cliente_tipo === "PERSONA";
  // La dirección es la elegida en el mantenedor de Direcciones (como en la OT). La dirección propia de la
  // ficha del cliente (cliente_direccion*) no se toma: en una empresa no viaja al documento.
  const { contacto_direccion: direccion, contacto_ciudad: ciudad, contacto_comuna: comuna } = cot;
  const camposDireccion = `
      ${campo("Dirección", direccion)}
      ${campo("Ciudad - Comuna", unir([ciudad, comuna], " - "))}`;

  const hayContacto = [cot.contacto_nombre, cot.contacto_cargo, cot.contacto_email, cot.contacto_fono, direccion].some((v) => String(v || "").trim());
  const seccionContacto = (esPersona || (!hayContacto && !contactosExtra.length)) ? "" : `
  <section class="sec">
    ${h2("Contacto")}
    <div class="grid grid-3">
      ${campo("Contacto", cot.contacto_nombre)}
      ${campo("Cargo Contacto", cot.contacto_cargo)}
      ${campo("Email Contacto", cot.contacto_email)}
      ${campo("Fono Contacto", cot.contacto_fono, true)}${camposDireccion}
    </div>
    ${contactosExtra.length ? `<div class="sub">› Contactos adicionales</div>${contactosExtra.map(contactoExtraHtml).join("")}` : ""}
  </section>`;

  return `
  <section class="sec">
    ${h2("Datos de Cliente")}
    <div class="grid grid-3">
      ${campo("Cliente", cot.cliente_razon_social)}
      ${campo("RUT", cot.cliente_rut, true)}${esPersona ? camposDireccion : ""}
      ${campo("Teléfono", cot.cliente_telefono, true)}
      ${campo("Email Cliente", cot.cliente_email)}
    </div>
  </section>${seccionContacto}`;
}

export function generarHtmlCotizacion(cot, opciones) {
  // Mismo criterio que el guardado: un ítem con SKU o Neto cargado se imprime aunque no tenga Detalle.
  const items = parseJsonArray(cot.items).filter((i) =>
    String(i?.sku || "").trim() || String(i?.detalle || "").trim() || Number(i?.neto) > 0
  );
  const contactosExtraTodos = contactosExtraDe(cot);
  const contactosExtra = opciones?.contactosExtra
    ? contactosExtraTodos.filter((_, i) => opciones.contactosExtra[i])
    : contactosExtraTodos;
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
  <div class="header-card">
    <div class="enc">
      ${slotLogo(LOGO_HLS, "HLS", "logo-hls")}
      <div class="emp-datos">
        <h1>${esc(EMPRESA.nombre)}</h1>
        <p>${esc(EMPRESA.direccion)}</p>
        <p>Fono: ${esc(EMPRESA.fono)} · ${esc(EMPRESA.email)} · ${esc(EMPRESA.web)}</p>
      </div>
      <div class="emp-rut">
        <div class="rs">${esc(EMPRESA_RAZON_SOCIAL)}</div>
        <div class="rut">${esc(EMPRESA_RUT)}</div>
      </div>
    </div>
    <div class="filete-1"></div>
    <div class="filete-2"></div>
  </div>

  <div class="titulo-barra">
    <div>
      <h1>Cotización <span class="folio-numero"><span class="l">N°</span><span class="v">${esc(cot.folio)}</span></span></h1>
    </div>
    <div class="folio">
      <span class="l">Emisión</span>
      <span class="v">${esc(fecha(cot.fecha_emision))}</span>
    </div>
  </div>
  ${seccionesCliente(cot, contactosExtra)}

  <section class="sec">
    ${h2("Ejecutivo")}
    <div class="grid grid-3">
      ${campo("Ejecutivo", cot.ejecutivo)}
      ${campo("Fono Ejecutivo", cot.ejecutivo_fono, true)}
      ${campo("Email Ejecutivo", cot.ejecutivo_email)}
    </div>
    ${cot.glosa ? `<div class="grid" style="margin-top:2mm"><div class="f" style="grid-column: 1 / -1"><span class="l">Glosa</span><span class="v">${esc(cot.glosa)}</span></div></div>` : ""}
  </section>

  <section class="sec">
    ${h2("Detalle")}
    <table class="items">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Detalle</th>
          <th class="num">Cant.</th>
          <th class="num">Neto</th>
          <th class="num">Desc.</th>
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
        <div class="grid cond-pie">
          ${campo("Condición", cot.condicion)}
          ${campo("Válido hasta", fecha(cot.fecha_valido_hasta))}
        </div>
      </div>
      <div class="totales">
        <div class="fila"><span>Neto:</span><span>${clp(neto)} CLP</span></div>
        <div class="fila"><span>IVA (19%):</span><span>${clp(iva)} CLP</span></div>
        <div class="fila total"><span>Total:</span><span>${clp(total)} CLP</span></div>
      </div>
    </div>
  </section>

  <section class="sec bancarios">
    ${h2("Datos Bancarios")}
    ${esc(DATOS_BANCARIOS.tipoCuenta)} del ${esc(DATOS_BANCARIOS.banco)}, N° ${esc(DATOS_BANCARIOS.numero)}
    a nombre de ${esc(DATOS_BANCARIOS.titular)}<br>Email: ${esc(EMPRESA.email)}; RUT ${esc(EMPRESA_RUT)}
  </section>
  </div>
</body>
</html>`;
}

export function tituloDocumentoCotizacion(cot) {
  const cliente = String(cot.cliente_razon_social || "").trim();
  return `COTIZACIÓN ${cot.folio ?? "SIN-FOLIO"}${cliente ? " - " + cliente : ""}`;
}
