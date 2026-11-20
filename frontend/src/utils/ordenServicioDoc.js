// Generador del documento "Orden de Servicio" (HTML listo para imprimir/guardar como PDF).
// Función pura: no toca el DOM ni React. La impresión la dispara utils/imprimir.js.
import { EMPRESA, LOGO_HLS, LOGO_BROTHER, CONDICIONES_ORDEN_SERVICIO } from "./empresa";
import { capitalizarNombre } from "./helpers";
import { ESTILOS_COMUNES } from "./pdfEstilos";
import { esc, fecha, campo, h2, slotLogo } from "./pdfHelpers";

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
  const direccionesExtra = parseJsonArray(orden.direcciones_extra).filter((d) => String(d?.direccion || "").trim());
  return { insumos, direccionesExtra };
}

// orden.ciudad es la Ciudad propia de la OT (agregada junto a Dirección/Comuna).
// Para OT viejas guardadas antes de ese campo, se cae al criterio anterior:
// dirección Matriz con ciudad cargada, si no la primera dirección extra que la
// tenga. Nunca se deriva de la comuna.
function resolverCiudad(orden, direccionesExtra) {
  if (String(orden.ciudad || "").trim()) return orden.ciudad;
  const matriz = direccionesExtra.find((d) => d.tipo === "Matriz" && String(d.ciudad || "").trim());
  if (matriz) return matriz.ciudad;
  const conCiudad = direccionesExtra.find((d) => String(d.ciudad || "").trim());
  return conCiudad ? conCiudad.ciudad : "";
}

function seccionTexto(titulo, valor) {
  return `<section class="sec sec-grande">${h2(titulo)}<div class="txt txt-grande">${esc(valor)}</div></section>`;
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
        <div class="n">${esc(capitalizarNombre(orden.tecnico_asignado))}</div>
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
const ESTILOS = `${ESTILOS_COMUNES}
.logo-brother { width: 20mm; height: 8mm; }
.brother-box { text-align: center; align-self: flex-end; }
.brother-leyenda { margin-top: 2pt; font-size: 6pt; text-transform: uppercase; letter-spacing: .1em; color: #6B7280; }
.emitida { margin: 2pt 0 0; font-size: 7pt; color: #6B7280; }
.garantia-chip { display: inline-block; margin-left: 8pt; background: #0C4A8C; border-radius: 999px; padding: 2pt 9pt; font-size: 6.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #fff; vertical-align: middle; }
.chips { margin-top: .8mm; }
.chip { display: inline-block; max-width: 100%; overflow-wrap: anywhere; background: #E8F1FB; border: .5pt solid rgba(12,74,140,.15); border-radius: 999px; padding: 1.5pt 7pt; font-size: 7.5pt; font-weight: 600; color: #0C4A8C; margin: 0 3pt 2pt 0; }
.txt { white-space: pre-wrap; overflow-wrap: anywhere; min-height: 0; font-size: 8.5pt; orphans: 3; widows: 3; }
.sec-grande { padding: 5mm 4mm 4.5mm; }
.txt-grande { font-size: 8.5pt; line-height: 1.6; min-height: 18mm; }
.pie { margin-top: auto; padding-top: 2.5mm; break-inside: avoid; border-top: .5pt solid #CBD5E1; }
.firmas { display: grid; grid-template-columns: 1fr 1fr; column-gap: 14mm; }
.firma-linea { border-top: .5pt solid #9CA3AF; width: 60mm; margin-top: 7mm; padding-top: 1.5mm; text-align: center; }
.firma-linea .t { font-size: 6pt; text-transform: uppercase; letter-spacing: .06em; color: #6B7280; }
.firma-linea .n { font-size: 8pt; font-weight: 600; margin-top: .8mm; overflow-wrap: anywhere; }
.legales { margin-top: 3mm; font-size: 6pt; color: #6B7280; }
.legales p { margin: 0 0 1.2mm; padding-left: 8pt; text-indent: -8pt; }
`;

// ── Generación ────────────────────────────────────────────────────────────
// orden: fila cruda de la OT (snake_case, tal como llega del listado GET /api/ordenes).
// opciones: booleanos por sección (contacto, averia, actividad, observaciones,
// firma) + array de booleanos alineado 1:1 con derivarListas(orden).insumos.
// La OT tiene un solo contacto; opciones.contacto === false lo omite del PDF.
export function generarHtmlOrdenServicio(orden, opciones) {
  const { insumos, direccionesExtra } = derivarListas(orden);
  const numero = String(orden.numero_orden || "").split("-").pop() || "—";
  const ciudad = resolverCiudad(orden, direccionesExtra);

  const insumosSel = insumos.filter((_, i) => opciones.insumos?.[i]);

  const marcaModelo = [orden.marca, orden.modelo].filter((v) => String(v || "").trim()).join(" ");

  // Empresa: la dirección es la del contacto y va en la sección Contacto. Persona: ella misma es el
  // contacto, así que no hay sección Contacto y su dirección va en Datos de Cliente.
  const esPersona = orden.cliente_tipo === "PERSONA";
  const camposDireccion = `
        ${campo("Dirección", orden.direccion)}
        ${campo("Ciudad - Comuna", [ciudad, orden.comuna].filter((v) => String(v || "").trim()).join(" - "))}`;

  const seccionContacto = (esPersona || opciones.contacto === false) ? "" : `
    <section class="sec">
      ${h2("Contacto")}
      <div class="grid grid-3">
        ${campo("Contacto", orden.contacto)}
        ${campo("Cargo Contacto", orden.cargo_contacto)}
        ${campo("Email Contacto", orden.email_contacto)}
        ${campo("Fono Contacto", orden.fono_contacto, true)}${camposDireccion}
      </div>
    </section>`;

  const seccionCliente = `
    <section class="sec">
      ${h2("Datos de Cliente")}
      <div class="grid grid-3">
        ${campo("Cliente", orden.cliente)}
        ${campo("RUT", orden.rut, true)}${esPersona ? camposDireccion : ""}
        ${campo("Teléfono", orden.fono_principal, true)}
        ${campo("Email Cliente", orden.email)}
      </div>
    </section>${seccionContacto}`;

  // El título ya no dice "Técnico Asignado" porque ese dato se muestra abajo
  // en el bloque "Técnico" (línea ~103); el campo sigue en formulario y BD.
  const seccionEquipo = `
    <section class="sec">
      ${h2("Datos de Equipo")}
      <div class="grid grid-3">
        ${campo("Equipo", orden.equipo)}
        ${campo("Marca / Modelo", marcaModelo)}
        ${campo("Serie", orden.serie, true)}
        ${campo("Contador Pág.", orden.contador_pag_out, true)}
        ${campo("Nivel de Tinta", orden.nivel_tinta)}
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
      <h1>Orden de Servicio <span class="folio-numero"><span class="l">N°</span><span class="v">${esc(numero)}</span></span>${orden.es_garantia ? '<span class="garantia-chip">Garantía</span>' : ""}</h1>
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
