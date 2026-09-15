import { useState, useEffect, useMemo } from "react";
import { X, FileDown } from "lucide-react";
import { contactosExtraDe, generarHtmlCotizacion, tituloDocumentoCotizacion } from "../../utils/cotizacionDoc";
import { imprimirHtml } from "../../utils/imprimir";

// Modal de opciones antes de generar el PDF de la Cotización: deja elegir
// qué contactos extra entran en el documento. Mismo patrón que
// ModalOpcionesPDF.jsx (Orden de Servicio): el contacto principal siempre
// se incluye, los extras son opt-in.
function ModalOpcionesPDFCotizacion({ cot, onClose }) {
  const contactosExtra = useMemo(() => contactosExtraDe(cot), [cot]);

  const [opciones, setOpciones] = useState(() => ({
    contactosExtra: contactosExtra.map(() => false),
  }));

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleIdx = (idx) =>
    setOpciones((o) => ({ ...o, contactosExtra: o.contactosExtra.map((v, i) => (i === idx ? !v : v)) }));

  const marcarTodos = (val) =>
    setOpciones((o) => ({ ...o, contactosExtra: Array(contactosExtra.length).fill(val) }));

  const hayContactoPrincipal = !!String(cot.contacto_nombre || "").trim();

  const generar = () => {
    imprimirHtml(generarHtmlCotizacion(cot, opciones), tituloDocumentoCotizacion(cot));
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-contactos modal-pdf" onClick={(e) => e.stopPropagation()}>
        <div className="modal-contactos-head">
          <h3>
            <FileDown size={18} />
            Generar Cotización <span className="modal-contactos-badge">N° {cot.folio ?? "—"}</span>
          </h3>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-contactos-body">
          <div className="mop-group">
            <div className="mop-group-head">
              <span className="mop-group-title">Contactos</span>
              {contactosExtra.length > 1 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="mop-toggle" onClick={() => marcarTodos(true)}>Todos</button>
                  <button type="button" className="mop-toggle" onClick={() => marcarTodos(false)}>Ninguno</button>
                </div>
              )}
            </div>
            <div className="mop-items mop-una-col">
              {hayContactoPrincipal && (
                <div className="mop-item mop-fijo">
                  {cot.contacto_nombre} <span className="mop-sub">— principal, siempre incluido</span>
                </div>
              )}
              {contactosExtra.length === 0 && !hayContactoPrincipal && (
                <div className="mop-item mop-fijo">Sin contactos cargados</div>
              )}
              {contactosExtra.map((c, i) => (
                <label key={i} className="mop-item">
                  <input type="checkbox" className="of-check of-check--pdf"
                    checked={opciones.contactosExtra[i]} onChange={() => toggleIdx(i)} />
                  {c.nombre} {c.cargo && <span className="mop-sub">— {c.cargo}</span>}
                </label>
              ))}
            </div>
          </div>

          <p className="mop-nota">
            ℹ En el diálogo de impresión elegí "Guardar como PDF" y, en Más ajustes,
            desmarcá "Encabezados y pies de página".
          </p>
        </div>

        <div className="modal-contactos-foot">
          <div className="modal-contactos-foot-actions" style={{ marginLeft: "auto" }}>
            <button type="button" className="cf-btn-c" onClick={onClose}>Cancelar</button>
            <button type="button" className="cf-btn-p" onClick={generar}>Generar PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalOpcionesPDFCotizacion;
