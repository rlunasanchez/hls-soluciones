// Estilos de impresión comunes a los PDF de la Orden de Servicio y de la Cotización: una sola fuente
// de verdad para la página, el encabezado, las secciones como tarjetas, la barra de título y los
// campos "etiqueta arriba, valor abajo". Cada documento agrega sus propios estilos encima.
// Un solo acento (#0C4A8C, el --primary de la app).
export const ESTILOS_COMUNES = `
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
.page { width: 210mm; min-height: 297mm; padding: 9mm 12mm 8mm; background: #FFFFFF; display: flex; flex-direction: column; }

.header-card { background: #FFFFFF; border: 0; box-shadow: 0 0 0 .4pt #64748B; border-radius: 7pt; padding: 3mm 4mm 2.2mm; break-inside: avoid; }
.enc { display: grid; grid-template-columns: 28mm 1fr auto; align-items: center; gap: 5mm; break-inside: avoid; }
.logo { display: flex; align-items: center; justify-content: center; }
img.logo { max-width: 100%; max-height: 100%; object-fit: contain; }
.logo-hls { width: 28mm; height: 13.1mm; align-self: flex-end; }
.logo--ph { border: .5pt dashed #CBD5E1; border-radius: 6pt; color: #94A3B8; font-size: 6pt; text-align: center; padding: 2pt; }
.emp-datos { text-align: center; }
.emp-datos h1 { margin: 0; font-size: 13pt; font-weight: 800; letter-spacing: -.01em; color: #0C4A8C; }
.emp-datos p { margin: 1pt 0 0; font-size: 8.5pt; color: #6B7280; }

.filete-1 { margin-top: 4pt; height: 2pt; border-radius: 2pt; background: #0C4A8C; }
.filete-2 { height: .5pt; background: #E5E7EB; margin-top: .8mm; }

.titulo-barra { display: flex; justify-content: space-between; align-items: center; margin-top: 4mm; break-inside: avoid; }
.titulo-barra h1 { margin: 0; font-size: 15pt; font-weight: 800; letter-spacing: .015em; color: #0C4A8C; }
.folio-numero { margin-left: 8pt; display: inline-flex; align-items: baseline; gap: 4pt; border-radius: 4pt; padding: 2pt 11pt; vertical-align: middle; background: #0C4A8C; }
.folio-numero .l { font-size: 8pt; font-weight: 700; color: #fff; }
.folio-numero .v { font-size: 20pt; font-weight: 800; color: #fff; font-variant-numeric: tabular-nums; line-height: 1; }
.folio { text-align: center; background: #F1F5F9; border: .75pt solid #E2E8F0; border-radius: 7pt; padding: 2pt 12pt; }
.folio .l { display: block; font-size: 6pt; text-transform: uppercase; letter-spacing: .1em; color: #6B7280; }
.folio .v { font-size: 9pt; font-weight: 600; font-variant-numeric: tabular-nums; color: #111827; }

.sec { margin-top: 2.8mm; break-inside: avoid; background: #FFFFFF; border: 0; box-shadow: 0 0 0 .4pt #64748B; border-radius: 7pt; padding: 2.2mm 4mm; }
.sec h2 { display: flex; justify-content: space-between; align-items: baseline; margin: 0 0 1.8mm; padding-left: 6pt; border-left: 5pt solid #0C4A8C; border-radius: 2pt; font-size: 7pt; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #0C4A8C; break-after: avoid; }
.h2-extra { color: #6B7280; font-weight: 600; letter-spacing: 0; text-transform: none; font-size: 7pt; }
.h2-extra b { color: #111827; }

.grid { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8mm; row-gap: 2mm; }
.grid-3 { grid-template-columns: 1fr 1fr 1fr; }
.f .l { display: block; font-size: 6pt; text-transform: uppercase; letter-spacing: .07em; color: #6B7280; }
.f .v { display: block; padding-bottom: 1mm; border-bottom: .5pt solid #E2E8F0; font-size: 9pt; font-weight: 600; color: #111827; overflow-wrap: anywhere; }
.f .v.num { font-variant-numeric: tabular-nums; }

.sub { margin-top: 2.5mm; font-size: 6pt; text-transform: uppercase; letter-spacing: .06em; color: #6B7280; }
`;
