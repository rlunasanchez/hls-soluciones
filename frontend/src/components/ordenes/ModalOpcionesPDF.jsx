import { useState, useEffect, useMemo } from "react";
import { X, FileDown } from "lucide-react";
import { derivarListas, generarHtmlOrdenServicio, tituloDocumento, resolverCiudad } from "../../utils/ordenServicioDoc";
import { imprimirHtml } from "../../utils/imprimir";

// Modal de opciones antes de generar el PDF de la Orden de Servicio: deja
// elegir qué insumos, contactos y direcciones extra (y qué secciones)
// entran en el documento, y cuál contacto actúa como principal — esto
// último es efímero (solo afecta este PDF, nunca se guarda en la OT). Por
// defecto reproduce el informe en papel (contacto principal + insumos
// cargados); los extras son opt-in.
function ModalOpcionesPDF({ orden, onClose }) {
  const { insumos, contactosExtra, direccionesExtra } = useMemo(() => derivarListas(orden), [orden]);

  const [opciones, setOpciones] = useState(() => ({
    insumos: insumos.map(() => true),
    direccionesExtra: direccionesExtra.map(() => false),
    averia: !!String(orden.averia || "").trim(),
    actividad: !!String(orden.actividad || "").trim(),
    observaciones: !!String(orden.observaciones || "").trim(),
    firma: true
  }));

  // Contacto principal del documento: "P" = el principal real de la OT,
  // "e{i}" = el contacto adicional en la posición i de contactosExtra.
  // Clave estable (no por posición) para que la elección no se desalinee
  // con la lista de adicionales cuando cambia.
  const [principalKey, setPrincipalKey] = useState("P");
  const [marcados, setMarcados] = useState({});

  const contactosTodos = useMemo(() => {
    // Si "P" queda desplazado a adicional, muestra la dirección del cliente
    // (el contacto principal de la OT nunca tuvo una propia) en vez de
    // aparecer sin dirección en la lista de adicionales.
    const principalDb = {
      key: "P", nombre: orden.contacto, cargo: orden.cargo_contacto,
      email: orden.email_contacto, fono: orden.fono_contacto,
      direccion: orden.direccion, ciudad: resolverCiudad(orden, direccionesExtra), comuna: orden.comuna
    };
    return [principalDb, ...contactosExtra.map((c, i) => ({ ...c, key: `e${i}` }))];
  }, [orden, contactosExtra, direccionesExtra]);

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

  const toggleIdx = (key, idx) =>
    setOpciones((o) => ({ ...o, [key]: o[key].map((v, i) => (i === idx ? !v : v)) }));

  const marcarTodos = (key, len, val) =>
    setOpciones((o) => ({ ...o, [key]: Array(len).fill(val) }));

  const toggleContacto = (key) => setMarcados((m) => ({ ...m, [key]: !m[key] }));

  const marcarTodosContactos = (val) =>
    setMarcados((m) => {
      const n = { ...m };
      extrasEfectivos.forEach((c) => { n[c.key] = val; });
      return n;
    });

  const numero = String(orden.numero_orden || "").split("-").pop() || "—";
  const puedeElegirPrincipal = contactosTodos.filter((c) => String(c.nombre || "").trim()).length > 1;
  const hayContactos = !!String(principalEfectivo?.nombre || "").trim() || extrasEfectivos.length > 0;

  const generar = () => {
    const opcionesPdf = {
      ...opciones,
      contactosExtra: extrasEfectivos.map((c) => !!marcados[c.key]),
    };
    const ordenPdf = principalKey === "P" ? orden : {
      ...orden,
      contacto: principalEfectivo.nombre || "",
      cargo_contacto: principalEfectivo.cargo || "",
      email_contacto: principalEfectivo.email || "",
      fono_contacto: principalEfectivo.fono || "",
      contacto_direccion: principalEfectivo.direccion || "",
      contacto_ciudad: principalEfectivo.ciudad || "",
      contacto_comuna: principalEfectivo.comuna || "",
      contactos_extra: JSON.stringify(extrasEfectivos.map(({ key, ...c }) => c)),
    };
    imprimirHtml(generarHtmlOrdenServicio(ordenPdf, opcionesPdf), tituloDocumento(ordenPdf));
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

          {puedeElegirPrincipal && (
            <div className="mop-group">
              <div className="mop-group-head">
                <span className="mop-group-title">Contacto principal del documento</span>
              </div>
              <div className="mop-items mop-una-col">
                {contactosTodos.filter((c) => String(c.nombre || "").trim()).map((c) => (
                  <label key={c.key} className="mop-item">
                    <input type="radio" name="mop-principal-ot" style={{ accentColor: "#7C3AED" }}
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

          {hayContactos && (
            <div className="mop-group">
              <div className="mop-group-head">
                <span className="mop-group-title">Contactos adicionales</span>
                {extrasEfectivos.length > 1 && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="mop-toggle" onClick={() => marcarTodosContactos(true)}>Todos</button>
                    <button type="button" className="mop-toggle" onClick={() => marcarTodosContactos(false)}>Ninguno</button>
                  </div>
                )}
              </div>
              <div className="mop-items mop-una-col">
                {!!String(principalEfectivo?.nombre || "").trim() && (
                  <div className="mop-item mop-fijo">
                    {principalEfectivo.nombre} <span className="mop-sub">— principal de este documento, siempre incluido</span>
                  </div>
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
          )}

          {/* Direcciones adicionales oculto de momento: el generador del PDF ya no
              las incluye (ver ordenServicioDoc.js), así que estos checkboxes no
              tendrían efecto. No borrar — ver CAMBIOS.md v2.112.
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
          */}

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
