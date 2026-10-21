import { useState, useEffect, useMemo } from "react";
import { X, FileDown } from "lucide-react";
import { derivarListas, generarHtmlOrdenServicio, tituloDocumento } from "../../utils/ordenServicioDoc";
import { imprimirHtml } from "../../utils/imprimir";

// Modal de opciones antes de generar el PDF de la Orden de Servicio: deja
// elegir qué insumos y qué secciones (contacto, falla, informe técnico,
// observaciones, firma) entran en el documento. La OT tiene un solo contacto,
// que se cambia desde la propia OT. Por defecto reproduce el informe en papel
// (todo lo que tenga datos).
function ModalOpcionesPDF({ orden, onClose }) {
  const { insumos } = useMemo(() => derivarListas(orden), [orden]);
  const esPersona = orden.cliente_tipo === "PERSONA";
  const tieneContacto = !esPersona && !!String(orden.contacto || "").trim();

  const [opciones, setOpciones] = useState(() => ({
    insumos: insumos.map(() => true),
    contacto: tieneContacto,
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

          <div className="mop-group">
            <div className="mop-group-head">
              <span className="mop-group-title">Secciones</span>
            </div>
            <div className="mop-items">
              {!esPersona && <label className={`mop-item${tieneContacto ? "" : " mop-off"}`}>
                <input type="checkbox" className="of-check of-check--pdf" disabled={!tieneContacto}
                  checked={opciones.contacto} onChange={() => setOpciones((o) => ({ ...o, contacto: !o.contacto }))} />
                Contacto{tieneContacto
                  ? <span className="mop-sub"> — {orden.contacto}{orden.cargo_contacto ? ` (${orden.cargo_contacto})` : ""}</span>
                  : <span className="mop-sub"> (sin datos)</span>}
              </label>}
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
