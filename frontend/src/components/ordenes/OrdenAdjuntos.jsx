import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ChevronDown, ChevronUp, Eye, Paperclip, MoreVertical, Download, Trash2, FileText, Printer } from "lucide-react";

// Apartado "Adjunto" de la OT: hasta 2 archivos (imagen o PDF, 5MB c/u) guardados como base64 en
// nuevaOrden.adjuntos. Incluye el menú por archivo (Ver / Descargar / Eliminar) y el visor.
function OrdenAdjuntos({ nuevaOrden, setNuevaOrden, readOnly = false }) {
  const [mostrarAdjunto, setMostrarAdjunto] = useState(false);
  const [mostrarMenuAdjunto, setMostrarMenuAdjunto] = useState(false);
  const [adjuntoParaVer, setAdjuntoParaVer] = useState(null);
  const [posAdjunto, setPosAdjunto] = useState({ top: 0, left: 0 });
  const adjuntoDropdownRef = useRef(null);
  const adjuntoIdxRef = useRef(-1);
  const btnAdjuntoRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adjuntoDropdownRef.current && adjuntoDropdownRef.current.contains(event.target)) return;
      if (event.target.closest(".acciones-menu-btn")) return;
      setMostrarMenuAdjunto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!mostrarMenuAdjunto || !btnAdjuntoRef.current || !adjuntoDropdownRef.current) return;
    const rect = btnAdjuntoRef.current.getBoundingClientRect();
    const menuHeight = adjuntoDropdownRef.current.offsetHeight;
    const menuWidth = 140;
    const left = Math.min(Math.max(rect.right - menuWidth, 4), window.innerWidth - menuWidth);
    let top = rect.bottom + 4;
    if (top + menuHeight > window.innerHeight) {
      top = Math.max(rect.top - menuHeight - 4, 4);
    }
    setPosAdjunto({ top, left });
  }, [mostrarMenuAdjunto]);

  const TIPOS_PERMITIDOS = ["image/", "application/pdf"];

  const handleAdjuntoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const actuales = nuevaOrden.adjuntos || [];
    if (actuales.length >= 2) {
      alert("Máximo 2 archivos adjuntos por orden.");
      e.target.value = "";
      return;
    }
    const permitido = TIPOS_PERMITIDOS.some((t) => file.type.startsWith(t)) || file.type === "application/pdf";
    if (!permitido) {
      alert("Solo se permiten imágenes (JPG, PNG, etc.) o PDF.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo supera el máximo de 5MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNuevaOrden({ ...nuevaOrden, adjuntos: [...actuales, { nombre: file.name, tipo: file.type, data: reader.result }] });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const abrirMenuAdjunto = (e, idx) => {
    e.stopPropagation();
    if (mostrarMenuAdjunto && adjuntoIdxRef.current === idx) {
      setMostrarMenuAdjunto(false);
      return;
    }
    adjuntoIdxRef.current = idx;
    btnAdjuntoRef.current = e.currentTarget;
    setMostrarMenuAdjunto(true);
  };

  const descargarAdjunto = (idx = adjuntoIdxRef.current) => {
    const adj = (nuevaOrden.adjuntos || [])[idx];
    if (!adj) return;
    const a = document.createElement("a");
    a.href = adj.data;
    a.download = adj.nombre || `adjunto-ot-${(nuevaOrden.numeroOrden || "").replace(/\s+/g, "-") || "archivo"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setMostrarMenuAdjunto(false);
  };

  const verAdjunto = (idx = adjuntoIdxRef.current) => {
    const adj = (nuevaOrden.adjuntos || [])[idx];
    if (!adj) return;
    setAdjuntoParaVer(adj);
    setMostrarMenuAdjunto(false);
  };

  const imprimirAdjunto = () => {
    if (!adjuntoParaVer || adjuntoParaVer.tipo === "application/pdf") return;
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.style.visibility = "hidden";
    document.body.appendChild(frame);
    const doc = frame.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(
      `<html><head><title>${adjuntoParaVer.nombre || "Adjunto"}</title></head>` +
      `<body style="margin:0;text-align:center;"><img src="${adjuntoParaVer.data}" style="max-width:100%;" ` +
      `onload="window.focus();window.print();" /></body></html>`
    );
    doc.close();
    setTimeout(() => { if (frame.parentNode) frame.parentNode.removeChild(frame); }, 60000);
  };

  const eliminarAdjunto = (idx = adjuntoIdxRef.current) => {
    const adj = (nuevaOrden.adjuntos || [])[idx];
    if (!adj) return;
    if (confirm(`¿Eliminar el archivo "${adj.nombre}"?`)) {
      setNuevaOrden({ ...nuevaOrden, adjuntos: (nuevaOrden.adjuntos || []).filter((_, i) => i !== idx) });
      setMostrarMenuAdjunto(false);
    }
  };

  return (
    <>
      <div style={{ marginTop: '10px', padding: '4px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', lineHeight: '1.2' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem', width: 'fit-content', maxWidth: '100%' }}>
          <button
            type="button"
            onClick={() => setMostrarAdjunto(!mostrarAdjunto)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit' }}
          >
            {mostrarAdjunto ? <ChevronUp size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
            <Paperclip size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            Adjunto
            {(nuevaOrden.adjuntos || []).length > 0 && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} title="Tiene adjunto" />
            )}
          </button>
        </label>

        {mostrarAdjunto && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(nuevaOrden.adjuntos || []).map((adj, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px' }}>
              {adj.tipo === "application/pdf" ? (
                <div style={{ width: '44px', height: '44px', borderRadius: '6px', border: '1px solid var(--border)', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={22} style={{ color: '#DC2626' }} />
                </div>
              ) : (
                adj.tipo.startsWith("image/") && (
                  <img
                    src={adj.data}
                    alt={adj.nombre}
                    style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)', flexShrink: 0 }}
                  />
                )
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {adj.nombre || "Archivo adjunto"}
                </div>
                <div style={{ fontSize: '.68rem', color: 'var(--muted)' }}>{idx === 0 ? "Adjunto 1" : "Adjunto 2"}</div>
              </div>
              <div className="acciones-menu" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="acciones-menu-btn"
                  onClick={(e) => abrirMenuAdjunto(e, idx)}
                  aria-label={`Opciones de ${adj.nombre}`}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))}

          {mostrarMenuAdjunto && (
            <div className="acciones-dropdown" ref={adjuntoDropdownRef} style={{ position: 'fixed', top: posAdjunto.top, left: posAdjunto.left, zIndex: 9999 }}>
              <button className="acciones-item ver" type="button" onClick={() => verAdjunto()}>
                <Eye size={14} /> Ver
              </button>
              {!readOnly && (
                <>
                  <button className="acciones-item edit" type="button" onClick={() => descargarAdjunto()}>
                    <Download size={14} /> Descargar
                  </button>
                  <button className="acciones-item delete" type="button" onClick={() => eliminarAdjunto()}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                </>
              )}
            </div>
          )}

          {(nuevaOrden.adjuntos || []).length < 2 && (
            <div className="of-f">
              <label
                className="ot-search"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: readOnly ? 'not-allowed' : 'pointer', color: 'var(--muted)', minHeight: '26px', margin: 0 }}
              >
                <Paperclip size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {readOnly ? "Sin archivo" : "Seleccionar archivo"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleAdjuntoChange}
                  disabled={readOnly}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}
        </div>
        )}
      </div>

      {adjuntoParaVer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', width: '90vw', maxWidth: '1000px', height: '88vh', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adjuntoParaVer.nombre}</span>
              <button type="button" onClick={() => setAdjuntoParaVer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)', lineHeight: 1 }} aria-label="Cerrar">×</button>
            </div>
            {adjuntoParaVer.tipo === "application/pdf" ? (
              <iframe
                src={adjuntoParaVer.data}
                title={adjuntoParaVer.nombre}
                style={{ width: '100%', height: '100%', flex: 1, border: 'none', borderRadius: '6px', background: '#fff' }}
              />
            ) : (
              <img src={adjuntoParaVer.data} alt={adjuntoParaVer.nombre} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '6px' }} />
            )}
            {adjuntoParaVer.tipo !== "application/pdf" && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button type="button" onClick={imprimirAdjunto} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: 'none', borderRadius: '6px', background: '#0D9488', color: '#fff', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
                  <Printer size={14} /> Imprimir
                </button>
                <button type="button" onClick={() => descargarAdjunto()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: 'none', borderRadius: '6px', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
                  <Download size={14} /> Descargar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default OrdenAdjuntos;
