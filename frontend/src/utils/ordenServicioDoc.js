// Generador del documento "Orden de Servicio" (HTML listo para imprimir/guardar como PDF).
// Función pura: no toca el DOM ni React. La impresión la dispara utils/imprimir.js.
import { EMPRESA, LOGO_HLS, LOGO_BROTHER, CONDICIONES_ORDEN_SERVICIO } from "./empresa";

// ── Helpers de escape y formato ──────────────────────────────────────────
// Los valores son texto libre escrito por el usuario y se inyectan con
// doc.write(): un "&", "<" o '"' sin escapar rompe el documento.
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]
));

// Recorta el string ISO en vez de pasar por new Date()/toLocaleDateString()
// para no arriesgar un corrimiento de día por huso horario.
const fecha = (v) => {
  const [y, m, d] = String(v ?? "").substring(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
};

// Campo de la grilla "label arriba, valor abajo". Si no hay valor, no se
// imprime nada: así los campos vacíos desaparecen solos y la grilla se recompone.
const campo = (label, valor, numerico = false) => (
  valor ? `<div class="f"><span class="l">${esc(label)}</span><span class="v${numerico ? " num" : ""}">${esc(valor)}</span></div>` : ""
);

const h2 = (titulo, extraHtml = "") => (
  `<h2><span>${esc(titulo)}</span>${extraHtml ? `<span class="h2-extra">${extraHtml}</span>` : ""}</h2>`
);

const slotLogo = (src, alt, cls) => (
  src
    ? `<img class="logo ${cls}" src="${src}" alt="${esc(alt)}">`
    : `<div class="logo ${cls} logo--ph">${esc(alt)}</div>`
);

const parseJsonArray = (val) => {
  try {
    const arr = JSON.parse(val || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

// ── Derivación de listas desde la orden cruda (snake_case) ──────────────
// Exportada para que el modal de opciones use exactamente el mismo orden/
// filtro que el generador: así no hay dos verdades sobre qué índice es qué.
export function derivarListas(orden) {
  const insumos = [];
  for (let i = 1; i <= 12; i++) {
    const nombre = String(orden[`insumo${i}`] || "").trim();
    if (nombre) insumos.push({ n: i, nombre });
  }
  const contactosExtra = parseJsonArray(orden.contactos_extra).filter((c) => String(c?.nombre || "").trim());
  const direccionesExtra = parseJsonArray(orden.direcciones_extra).filter((d) => String(d?.direccion || "").trim());
  return { insumos, contactosExtra, direccionesExtra };
}

// No existe columna "ciudad" a nivel de OT: se toma de la dirección Matriz
// si tiene ciudad cargada, si no de la primera dirección extra que la tenga.
// Nunca se deriva de la comuna.
function resolverCiudad(direccionesExtra) {
  const matriz = direccionesExtra.find((d) => d.tipo === "Matriz" && String(d.ciudad || "").trim());
  if (matriz) return matriz.ciudad;
  const conCiudad = direccionesExtra.find((d) => String(d.ciudad || "").trim());
  return conCiudad ? conCiudad.ciudad : "";
}

function contactoExtraHtml(c) {
  const detalle = [c.cargo, c.fono, c.email, c.direccion].filter((v) => String(v || "").trim()).map(esc).join(" · ");
  return `<div class="extra-item"><span class="nom">${esc(c.nombre)}</span>${detalle ? ` <span class="det">${detalle}</span>` : ""}</div>`;
}

function direccionExtraHtml(d) {
  const tipo = String(d.tipo || "").trim();
  const linea = [d.direccion, d.ciudad || d.comuna].filter((v) => String(v || "").trim()).join(", ");
  const nom = tipo ? `${tipo} — ${linea}` : linea;
  const fono = String(d.fono || "").trim();
  return `<div class="extra-item"><span class="nom">${esc(nom)}</span>${fono ? ` <span class="det">${esc(fono)}</span>` : ""}</div>`;
}

function seccionTexto(titulo, valor) {
  return `<section class="sec">${h2(titulo)}<div class="txt">${esc(valor)}</div></section>`;
}

function seccionObservaciones(orden) {
  const fc = fecha(orden.fecha_compra);
  const extra = fc ? `F/COMPRA <b>${esc(fc)}</b>` : "";
  return `<section class="sec">${h2("Observaciones", extra)}<div class="txt">${esc(orden.observaciones)}</div></section>`;
}

function piePagina(orden) {
  return `
  <div class="pie">
    <div class="firmas">
      <div class="firma-linea">
        <div class="t">Recibido conforme — Cliente</div>
        <div class="n">Nombre · RUT · Fecha</div>
      </div>
      <div class="firma-linea">
        <div class="t">Técnico</div>
        <div class="n">${esc(orden.tecnico_asignado || "")}</div>
      </div>
    </div>
    <div class="legales">
      ${CONDICIONES_ORDEN_SERVICIO.map((t) => `<p>* ${esc(t)}</p>`).join("")}
    </div>
  </div>`;
}

// ── Estilos de impresión ─────────────────────────────────────────────────
// Un solo acento (#0C4A8C, el --primary de la app). La modernización
// respecto al informe en papel: secciones como tarjetas con tinte suave,
// barra de acento en vez de línea completa, folio como badge, chips
// rellenos. Mismo orden de datos que antes, solo cambia la piel visual.
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

/* Fondo de página como caja propia (no background-clip) para que se vea
   igual en cualquier visor de PDF, incluidos los de celular. */
.page { width: 210mm; min-height: 297mm; padding: 9mm 12mm 8mm; background: #EEF2F7; }

.header-card { background: #FFFFFF; border: .5pt solid #E2E8F0; border-radius: 7pt; padding: 3mm 4mm 2.2mm; box-shadow: 0 1px 4px rgba(15,23,42,.15); break-inside: avoid; }
.enc { display: grid; grid-template-columns: 24mm 1fr auto; align-items: center; gap: 5mm; break-inside: avoid; }
.logo { display: flex; align-items: center; justify-content: center; }
.logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
.logo-hls { width: 24mm; height: 24mm; }
.logo-brother { width: 20mm; height: 8mm; }
.logo--ph { border: .5pt dashed #CBD5E1; border-radius: 6pt; color: #94A3B8; font-size: 6pt; text-align: center; padding: 2pt; }
.emp-datos { text-align: center; }
.emp-datos h1 { margin: 0; font-size: 13pt; font-weight: 800; letter-spacing: -.01em; color: #0C4A8C; }
.emp-datos p { margin: 1pt 0 0; font-size: 7pt; color: #6B7280; }
.brother-box { text-align: center; align-self: flex-end; }
.brother-leyenda { margin-top: 2pt; font-size: 6pt; text-transform: uppercase; letter-spacing: .1em; color: #6B7280; }

.filete-1 { margin-top: 4pt; height: 2pt; border-radius: 2pt; background: #0C4A8C; }
.filete-2 { height: .5pt; background: #E5E7EB; margin-top: .8mm; }

.titulo-barra { display: flex; justify-content: space-between; align-items: center; margin-top: 4mm; break-inside: avoid; }
.titulo-barra h1 { margin: 0; font-size: 15pt; font-weight: 800; letter-spacing: .015em; color: #0C4A8C; }
.emitida { margin: 2pt 0 0; font-size: 7pt; color: #6B7280; }
.garantia-chip { display: inline-block; margin-left: 8pt; background: #0C4A8C; border-radius: 999px; padding: 2pt 9pt; font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #fff; vertical-align: middle; }
.folio-numero { margin-left: 8pt; font-size: 10pt; font-weight: 700; color: #6B7280; font-variant-numeric: tabular-nums; vertical-align: middle; }
.folio { text-align: center; background: #0C4A8C; border-radius: 7pt; padding: 2pt 12pt; }
.folio .l { display: block; font-size: 6pt; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.75); }
.folio .v { font-size: 14pt; font-weight: 800; font-variant-numeric: tabular-nums; color: #fff; }

.sec { margin-top: 2.8mm; break-inside: avoid; background: #FFFFFF; border: .5pt solid #E2E8F0; border-radius: 7pt; padding: 2.2mm 4mm; box-shadow: 0 1px 4px rgba(15,23,42,.15); }
.sec h2 { display: flex; justify-content: space-between; align-items: baseline; margin: 0 0 1.8mm; padding-left: 6pt; border-left: 5pt solid #0C4A8C; border-radius: 2pt; font-size: 7pt; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #0C4A8C; break-after: avoid; }
.h2-extra { color: #6B7280; font-weight: 600; letter-spacing: 0; text-transform: none; font-size: 7pt; }
.h2-extra b { color: #111827; }

.grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8mm; row-gap: 2mm; }
.f .l { display: block; font-size: 6pt; text-transform: uppercase; letter-spacing: .07em; color: #6B7280; }
.f .v { display: block; padding-bottom: 1mm; border-bottom: .5pt solid #E2E8F0; font-size: 9pt; font-weight: 600; color: #111827; overflow-wrap: anywhere; }
.f .v.num { font-variant-numeric: tabular-nums; }

.sub { margin-top: 2.5mm; font-size: 6pt; text-transform: uppercase; letter-spacing: .06em; color: #6B7280; }
.extra-item { margin-top: 1.2mm; }
.extra-item .nom { font-size: 8pt; font-weight: 700; }
.extra-item .det { font-size: 7pt; color: #6B7280; }

.chips { margin-top: .8mm; }
.chip { display: inline-block; background: #E8F1FB; border: .5pt solid rgba(12,74,140,.15); border-radius: 999px; padding: 1.5pt 7pt; font-size: 7.5pt; font-weight: 600; color: #0C4A8C; margin: 0 3pt 2pt 0; }

.txt { white-space: pre-wrap; overflow-wrap: anywhere; min-height: 0; font-size: 8.5pt; orphans: 3; widows: 3; }

.pie { margin-top: 3mm; break-inside: avoid; border-top: .5pt solid #CBD5E1; padding-top: 2.5mm; }
.firmas { display: grid; grid-template-columns: 1fr 1fr; column-gap: 14mm; }
.firma-linea { border-top: .5pt solid #9CA3AF; width: 60mm; margin-top: 7mm; padding-top: 1.5mm; text-align: center; }
.firma-linea .t { font-size: 6pt; text-transform: uppercase; letter-spacing: .06em; color: #6B7280; }
.firma-linea .n { font-size: 8pt; font-weight: 600; margin-top: .8mm; }

.legales { margin-top: 3mm; font-size: 6pt; color: #6B7280; }
.legales p { margin: 0 0 1.2mm; padding-left: 8pt; text-indent: -8pt; }
`;

// ── Generación ────────────────────────────────────────────────────────────
// orden: fila cruda de la OT (snake_case, tal como llega del listado GET /api/ordenes).
// opciones: booleanos por sección + arrays de booleanos alineados 1:1 con
// derivarListas(orden).insumos / .contactosExtra / .direccionesExtra.
export function generarHtmlOrdenServicio(orden, opciones) {
  const { insumos, contactosExtra, direccionesExtra } = derivarListas(orden);
  const numero = String(orden.numero_orden || "").split("-").pop() || "—";
  const ciudad = resolverCiudad(direccionesExtra);

  const insumosSel = insumos.filter((_, i) => opciones.insumos?.[i]);
  const contactosSel = contactosExtra.filter((_, i) => opciones.contactosExtra?.[i]);
  const direccionesSel = direccionesExtra.filter((_, i) => opciones.direccionesExtra?.[i]);

  const marcaModelo = [orden.marca, orden.modelo].filter((v) => String(v || "").trim()).join(" ");

  const seccionCliente = `
    <section class="sec">
      ${h2("Datos de Cliente — Contacto")}
      <div class="grid">
        ${campo("Cliente", orden.cliente)}
        ${campo("RUT", orden.rut, true)}
        ${campo("Dirección", orden.direccion)}
        ${campo("Ciudad - Comuna", [ciudad, orden.comuna].filter((v) => String(v || "").trim()).join(" - "))}
        ${campo("Email Cliente", orden.email)}
        ${campo("Teléfono", orden.fono_principal, true)}
        ${campo("Contacto", orden.contacto)}
        ${campo("Email Contacto", orden.email_contacto)}
        ${campo("Fono Contacto", orden.fono_contacto, true)}
      </div>
      ${contactosSel.length ? `<div class="sub">› Contactos adicionales</div>${contactosSel.map(contactoExtraHtml).join("")}` : ""}
      ${direccionesSel.length ? `<div class="sub">› Direcciones adicionales</div>${direccionesSel.map(direccionExtraHtml).join("")}` : ""}
    </section>`;

  const seccionEquipo = `
    <section class="sec">
      ${h2("Datos de Equipo — Técnico Asignado")}
      <div class="grid">
        ${campo("Equipo", orden.equipo)}
        ${campo("Serie", orden.serie, true)}
        ${campo("Marca / Modelo", marcaModelo)}
        ${campo("Contador Pág.", orden.contador_pag_out, true)}
        ${campo("Nivel de Tinta", orden.nivel_tinta)}
        ${campo("Técnico Asignado", orden.tecnico_asignado)}
      </div>
      ${insumosSel.length ? `<div class="sub">› Insumos</div><div class="chips">${insumosSel.map((i) => `<span class="chip">${esc(i.nombre)}</span>`).join("")}</div>` : ""}
    </section>`;

  const seccionAveria = opciones.averia && orden.averia ? seccionTexto("Falla — Incidencia", orden.averia) : "";
  const seccionActividad = opciones.actividad && orden.actividad ? seccionTexto("Informe Técnico", orden.actividad) : "";
  const seccionObs = opciones.observaciones && orden.observaciones ? seccionObservaciones(orden) : "";
  const pie = opciones.firma ? piePagina(orden) : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${esc(tituloDocumento(orden))}</title>
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
      <div class="brother-box">
        ${slotLogo(LOGO_BROTHER, "BROTHER", "logo-brother")}
        <div class="brother-leyenda">${esc(EMPRESA.leyendaBrother)}</div>
      </div>
    </div>
    <div class="filete-1"></div>
    <div class="filete-2"></div>
  </div>

  <div class="titulo-barra">
    <div>
      <h1>Orden de Servicio <span class="folio-numero">N° ${esc(numero)}</span>${orden.es_garantia ? '<span class="garantia-chip">Garantía</span>' : ""}</h1>
    </div>
    <div class="folio">
      <span class="l">Fecha</span>
      <span class="v">${esc(fecha(orden.fecha))}</span>
    </div>
  </div>

  ${seccionCliente}
  ${seccionEquipo}
  ${seccionAveria}
  ${seccionActividad}
  ${seccionObs}
  ${pie}
  </div>
</body>
</html>`;
}

export function tituloDocumento(orden) {
  const numero = String(orden.numero_orden || "").split("-").pop() || "SIN-NUMERO";
  const cliente = String(orden.cliente || "").trim();
  return `ORDEN DE SERVICIO ${numero}${cliente ? " - " + cliente : ""}`;
}
