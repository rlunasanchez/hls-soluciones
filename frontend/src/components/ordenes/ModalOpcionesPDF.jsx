import { useState, useEffect, useMemo } from "react";
import { X, FileDown } from "lucide-react";
import { derivarListas, generarHtmlOrdenServicio, tituloDocumento } from "../../utils/ordenServicioDoc";
import { imprimirHtml } from "../../utils/imprimir";

// Modal de opciones antes de generar el PDF de la Orden de Servicio: deja
// elegir qué insumos, contactos y direcciones extra (y qué secciones)
// entran en el documento. Por defecto reproduce el informe en papel
// (contacto principal + insumos cargados); los extras son opt-in.
function ModalOpcionesPDF({ orden, onClose }) {
  const { insumos, contactosExtra, direccionesExtra } = useMemo(() => derivarListas(orden), [orden]);

  const [opciones, setOpciones] = useState(() => ({
    insumos: insumos.map(() => true),
    contactoPrincipal: !!String(orden.contacto || "").trim(),
    contactosExtra: contactosExtra.map(() => false),
    direccionesExtra: direccionesExtra.map(() => false),
    averia: !!String(orden.averia || "").trim(),
    actividad: !!String(orden.actividad || "").trim(),
    observaciones: !!String(orden.observaciones || "").trim(),
    firma: true
  }));

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleIdx = (key, idx) =>
    setOpciones((o) => ({ ...o, [key]: o[key].map((v, i) => (i === idx ? !v : v)) }));

  const marcarTodos = (key, len, val) =>
    setOpciones((o) => ({ ...o, [key]: Array(len).fill(val) }));

  const numero = String(orden.numero_orden || "").split("-").pop() || "—";
  const hayContacto = !!String(orden.contacto || "").trim();
  const hayContactos = hayContacto || contactosExtra.length > 0;

  const generar = () => {
    imprimirHtml(generarHtmlOrdenServicio(orden, opciones), tituloDocumento(orden));
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-contactos modal-pdf" onClick={(e) => e.stopPropagation()}>
        <div className="modal-contactos-head">
          <h3>
            <FileDown size={18} />
            Generar Orden de Servicio <span className="modal-contactos-badge">N° {numero}</span>
          </h3>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-contactos-body">
          {insumos.length > 0 && (
            <div className="mop-group">
              <div className="mop-group-head">
                <span className="mop-group-title">Insumos ({insumos.length})</span>
                {insumos.length > 1 && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="mop-toggle" onClick={() => marcarTodos("insumos", insumos.length, true)}>Todos</button>
                    <button type="button" className="mop-toggle" onClick={() => marcarTodos("insumos", insumos.length, false)}>Ninguno</button>
                  </div>
                )}
              </div>
              <div className="mop-items">
                {insumos.map((ins, i) => (
                  <label key={ins.n} className="mop-item">
                    <input type="checkbox" className="of-check of-check--pdf"
                      checked={opciones.insumos[i]} onChange={() => toggleIdx("insumos", i)} />
                    {ins.nombre}
                  </label>
                ))}
              </div>
            </div>
          )}

          {hayContactos && (
            <div className="mop-group">
              <div className="mop-group-head">
                <span className="mop-group-title">Contactos</span>
                {contactosExtra.length > 1 && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="mop-toggle" onClick={() => marcarTodos("contactosExtra", contactosExtra.length, true)}>Todos</button>
                    <button type="button" className="mop-toggle" onClick={() => marcarTodos("contactosExtra", contactosExtra.length, false)}>Ninguno</button>
                  </div>
                )}
              </div>
              <div className="mop-items mop-una-col">
                {hayContacto && (
                  <label className="mop-item">
                    <input type="checkbox" className="of-check of-check--pdf"
                      checked={opciones.contactoPrincipal}
                      onChange={() => setOpciones((o) => ({ ...o, contactoPrincipal: !o.contactoPrincipal }))} />
                    {orden.contacto} <span className="mop-sub">— principal</span>
                  </label>
                )}
                {contactosExtra.map((c, i) => (
                  <label key={i} className="mop-item">
                    <input type="checkbox" className="of-check of-check--pdf"
                      checked={opciones.contactosExtra[i]} onChange={() => toggleIdx("contactosExtra", i)} />
                    {c.nombre} {c.cargo && <span className="mop-sub">— {c.cargo}</span>}
                  </label>
                ))}
              </div>
            </div>
          )}

          {direccionesExtra.length > 0 && (
            <div className="mop-group">
              <div className="mop-group-head">
                <span className="mop-group-title">Direcciones adicionales ({direccionesExtra.length})</span>
                {direccionesExtra.length > 1 && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="mop-toggle" onClick={() => marcarTodos("direccionesExtra", direccionesExtra.length, true)}>Todos</button>
                    <button type="button" className="mop-toggle" onClick={() => marcarTodos("direccionesExtra", direccionesExtra.length, false)}>Ninguno</button>
                  </div>
                )}
              </div>
              <div className="mop-items mop-una-col">
                {direccionesExtra.map((d, i) => (
                  <label key={i} className="mop-item">
                    <input type="checkbox" className="of-check of-check--pdf"
                      checked={opciones.direccionesExtra[i]} onChange={() => toggleIdx("direccionesExtra", i)} />
                    {d.tipo ? `${d.tipo} — ` : ""}{d.direccion}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mop-group">
            <div className="mop-group-head">
              <span className="mop-group-title">Secciones</span>
            </div>
            <div className="mop-items">
              <label className={`mop-item${orden.averia ? "" : " mop-off"}`}>
                <input type="checkbox" className="of-check of-check--pdf" disabled={!orden.averia}
                  checked={opciones.averia} onChange={() => setOpciones((o) => ({ ...o, averia: !o.averia }))} />
                Falla / Incidencia{!orden.averia && <span className="mop-sub"> (sin datos)</span>}
              </label>
              <label className={`mop-item${orden.actividad ? "" : " mop-off"}`}>
                <input type="checkbox" className="of-check of-check--pdf" disabled={!orden.actividad}
                  checked={opciones.actividad} onChange={() => setOpciones((o) => ({ ...o, actividad: !o.actividad }))} />
                Informe Técnico{!orden.actividad && <span className="mop-sub"> (sin datos)</span>}
              </label>
              <label className={`mop-item${orden.observaciones ? "" : " mop-off"}`}>
                <input type="checkbox" className="of-check of-check--pdf" disabled={!orden.observaciones}
                  checked={opciones.observaciones} onChange={() => setOpciones((o) => ({ ...o, observaciones: !o.observaciones }))} />
                Observaciones{!orden.observaciones && <span className="mop-sub"> (sin datos)</span>}
              </label>
              <label className="mop-item">
                <input type="checkbox" className="of-check of-check--pdf"
                  checked={opciones.firma} onChange={() => setOpciones((o) => ({ ...o, firma: !o.firma }))} />
                Firma y condiciones
              </label>
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

export default ModalOpcionesPDF;
