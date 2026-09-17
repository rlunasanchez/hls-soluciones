import { useState, useEffect, useMemo } from "react";
import { X, FileDown } from "lucide-react";
import { contactosExtraDe, generarHtmlCotizacion, tituloDocumentoCotizacion } from "../../utils/cotizacionDoc";
import { imprimirHtml } from "../../utils/imprimir";

// Modal de opciones antes de generar el PDF de la Cotización: deja elegir
// qué contactos extra entran en el documento, y cuál contacto actúa como
// principal — esto último es efímero (solo afecta este PDF, nunca se
// guarda en la cotización). Mismo patrón que ModalOpcionesPDF.jsx (Orden
// de Servicio).
function ModalOpcionesPDFCotizacion({ cot, onClose }) {
  const contactosExtra = useMemo(() => contactosExtraDe(cot), [cot]);

  const [marcados, setMarcados] = useState({});

  // Contacto principal del documento: "P" = el principal real de la
  // cotización, "e{i}" = el adicional en la posición i de contactosExtra.
  const [principalKey, setPrincipalKey] = useState("P");

  const contactosTodos = useMemo(() => {
    // Si "P" queda desplazado a adicional, muestra la dirección del cliente
    // (el contacto principal de la cotización nunca tuvo una propia) en vez
    // de aparecer sin dirección en la lista de adicionales.
    const principalDb = {
      key: "P", nombre: cot.contacto_nombre, cargo: cot.contacto_cargo,
      email: cot.contacto_email, fono: cot.contacto_fono,
      direccion: cot.cliente_direccion, ciudad: cot.cliente_ciudad, comuna: cot.cliente_comuna
    };
    return [principalDb, ...contactosExtra.map((c, i) => ({ ...c, key: `e${i}` }))];
  }, [cot, contactosExtra]);

  const { principalEfectivo, extrasEfectivos } = useMemo(() => {
    const principalEfectivo = contactosTodos.find((c) => c.key === principalKey) ?? contactosTodos[0];
    const extrasEfectivos = contactosTodos.filter(
      (c) => c.key !== principalKey && String(c.nombre || "").trim()
    );
    return { principalEfectivo, extrasEfectivos };
  }, [contactosTodos, principalKey]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleContacto = (key) => setMarcados((m) => ({ ...m, [key]: !m[key] }));

  const marcarTodos = (val) =>
    setMarcados((m) => {
      const n = { ...m };
      extrasEfectivos.forEach((c) => { n[c.key] = val; });
      return n;
    });

  const puedeElegirPrincipal = contactosTodos.filter((c) => String(c.nombre || "").trim()).length > 1;
  const hayContactoPrincipal = !!String(principalEfectivo?.nombre || "").trim();

  const generar = () => {
    const opciones = {
      contactosExtra: extrasEfectivos.map((c) => !!marcados[c.key]),
    };
    const cotPdf = principalKey === "P" ? cot : {
      ...cot,
      contacto_nombre: principalEfectivo.nombre || "",
      contacto_cargo: principalEfectivo.cargo || "",
      contacto_email: principalEfectivo.email || "",
      contacto_fono: principalEfectivo.fono || "",
      contacto_direccion: principalEfectivo.direccion || "",
      contacto_ciudad: principalEfectivo.ciudad || "",
      contacto_comuna: principalEfectivo.comuna || "",
      contactos_extra: JSON.stringify(extrasEfectivos.map(({ key, ...c }) => c)),
    };
    imprimirHtml(generarHtmlCotizacion(cotPdf, opciones), tituloDocumentoCotizacion(cotPdf));
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
          {puedeElegirPrincipal && (
            <div className="mop-group">
              <div className="mop-group-head">
                <span className="mop-group-title">Contacto principal del documento</span>
              </div>
              <div className="mop-items mop-una-col">
                {contactosTodos.filter((c) => String(c.nombre || "").trim()).map((c) => (
                  <label key={c.key} className="mop-item">
                    <input type="radio" name="mop-principal-cot" style={{ accentColor: "#7C3AED" }}
                      checked={principalKey === c.key} onChange={() => setPrincipalKey(c.key)} />
                    {c.nombre} {c.cargo && <span className="mop-sub">— {c.cargo}</span>}
                    {c.key === "P" && <span className="mop-sub"> (guardado)</span>}
                    {c.key !== "P" && (c.direccion || c.ciudad || c.comuna) && (
                      <span className="mop-sub"> · si es principal, la dirección se imprime solo si es distinta a la del cliente</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mop-group">
            <div className="mop-group-head">
              <span className="mop-group-title">Contactos adicionales</span>
              {extrasEfectivos.length > 1 && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="mop-toggle" onClick={() => marcarTodos(true)}>Todos</button>
                  <button type="button" className="mop-toggle" onClick={() => marcarTodos(false)}>Ninguno</button>
                </div>
              )}
            </div>
            <div className="mop-items mop-una-col">
              {hayContactoPrincipal && (
                <div className="mop-item mop-fijo">
                  {principalEfectivo.nombre} <span className="mop-sub">— principal de este documento, siempre incluido</span>
                </div>
              )}
              {extrasEfectivos.length === 0 && !hayContactoPrincipal && (
                <div className="mop-item mop-fijo">Sin contactos cargados</div>
              )}
              {extrasEfectivos.map((c) => (
                <label key={c.key} className="mop-item">
                  <input type="checkbox" className="of-check of-check--pdf"
                    checked={!!marcados[c.key]} onChange={() => toggleContacto(c.key)} />
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
