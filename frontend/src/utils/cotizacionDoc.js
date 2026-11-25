// Generador del documento "Cotización" (HTML listo para imprimir/guardar como PDF).
// Función pura: no toca el DOM ni React. La impresión la dispara utils/imprimir.js.
// Mismo estilo que la Orden de Servicio (ordenServicioDoc.js): comparten pdfEstilos.js y pdfHelpers.js.
import { EMPRESA, EMPRESA_RUT, LOGO_HLS, DATOS_BANCARIOS, CONDICIONES_COTIZACION } from "./empresa";
import { ESTILOS_COMUNES } from "./pdfEstilos";
import { esc, fecha, campo, h2, slotLogo, unir } from "./pdfHelpers";

const clp = (n) => Math.round(Number(n) || 0).toLocaleString("es-CL");

// Vista previa de los montos en el formulario, con la MISMA regla que el servidor (backend/utils/cotizacionTotales.js),
// que es quien los calcula y guarda al grabar la cotización: total de cada ítem redondeado, neto = suma de los
// ítems, IVA 19 % redondeado. El PDF no calcula: lee los montos guardados.
export function calcularTotales(items, ivaPorcentaje = 19) {
  const neto = (Array.isArray(items) ? items : []).reduce((suma, i) => {
    const cantidad = Math.max(0, Number(i.cantidad) || 0);
    const unitario = Math.max(0, Math.round(Number(i.neto) || 0));
    const descuentoPct = Math.min(100, Math.max(0, Number(i.descuento) || 0));
    return suma + Math.round(cantidad * unitario * (1 - descuentoPct / 100));
  }, 0);
  const iva = Math.round((neto * ivaPorcentaje) / 100);
  return { neto, iva, total: neto + iva };
}

// Una fila de la tabla de ítems: lee el total guardado de cada ítem.
function filaItem(item) {
  const cantidad = Number(item.cantidad) || 0;
  const descuentoPct = Number(item.descuento) || 0;
  return `
    <tr>
      <td class="sku">${item.sku ? esc(item.sku) : "-"}</td>
      <td class="detalle">${esc(item.detalle)}</td>
      <td class="num">${cantidad || ""}</td>
      <td class="num">${clp(item.neto)}</td>
      <td class="num">${descuentoPct ? descuentoPct + "%" : ""}</td>
      <td class="num">${clp(item.total)}</td>
    </tr>`;
}

// Lo propio de la cotización, encima de los estilos comunes: las fechas de emisión y validez,
// tabla de ítems, condiciones, totales y datos bancarios.
const ESTILOS = `${ESTILOS_COMUNES}
.folios { display: flex; gap: 4mm; }

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

// Secciones de cliente y contacto como en la OT: una empresa lleva su contacto y la dirección en la sección
// Contacto; una persona no tiene contacto y su dirección va en Datos de Cliente.
function seccionesCliente(cot) {
  const esPersona = cot.cliente_tipo === "PERSONA";
  // La dirección es la elegida en el mantenedor de Direcciones (como en la OT); la dirección propia de la
  // ficha del cliente no se guarda ni se toma.
  const { direccion, ciudad, comuna } = cot;
  const camposDireccion = `
      ${campo("Dirección", direccion)}
      ${campo("Ciudad - Comuna", unir([ciudad, comuna], " - "))}`;

  const hayContacto = [cot.contacto, cot.cargo_contacto, cot.email_contacto, cot.fono_contacto, direccion].some((v) => String(v || "").trim());
  const seccionContacto = (esPersona || !hayContacto) ? "" : `
  <section class="sec">
    ${h2("Contacto")}
    <div class="grid grid-3">
      ${campo("Contacto", cot.contacto)}
      ${campo("Cargo Contacto", cot.cargo_contacto)}
      ${campo("Email Contacto", cot.email_contacto)}
      ${campo("Fono Contacto", cot.fono_contacto, true)}${camposDireccion}
    </div>
  </section>`;

  return `
  <section class="sec">
    ${h2("Datos de Cliente")}
    <div class="grid grid-3">
      ${campo("Cliente", cot.cliente)}
      ${campo("RUT", cot.rut, true)}${esPersona ? camposDireccion : ""}
      ${campo("Teléfono", cot.fono_principal, true)}
      ${campo("Email Cliente", cot.email)}
    </div>
  </section>${seccionContacto}`;
}

// cot: la cotización completa del servidor (GET /api/cotizaciones/:id): sus columnas, los montos guardados
// (neto, iva, total) y `items`, la lista de filas de cotizacion_items.
export function generarHtmlCotizacion(cot) {
  const items = Array.isArray(cot.items) ? cot.items : [];
  const { neto, iva, total } = cot;

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
    </div>
    <div class="filete-1"></div>
    <div class="filete-2"></div>
  </div>

  <div class="titulo-barra">
    <div>
      <h1>Cotización <span class="folio-numero"><span class="l">N°</span><span class="v">${esc(cot.folio)}</span></span></h1>
    </div>
    <div class="folios">
      <div class="folio">
        <span class="l">Emisión</span>
        <span class="v">${esc(fecha(cot.fecha_emision))}</span>
      </div>
      ${fecha(cot.fecha_valido_hasta) ? `<div class="folio">
        <span class="l">Válido hasta</span>
        <span class="v">${esc(fecha(cot.fecha_valido_hasta))}</span>
      </div>` : ""}
    </div>
  </div>
  ${seccionesCliente(cot)}

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
        </div>
      </div>
      <div class="totales">
        <div class="fila"><span>Neto:</span><span>${clp(neto)} CLP</span></div>
        <div class="fila"><span>IVA (${esc(Number(cot.iva_porcentaje) || 19)}%):</span><span>${clp(iva)} CLP</span></div>
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
  const cliente = String(cot.cliente || "").trim();
  return `COTIZACIÓN ${cot.folio ?? "SIN-FOLIO"}${cliente ? " - " + cliente : ""}`;
}
