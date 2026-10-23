import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, Printer, X } from "lucide-react";
import { esPdf, formatoTamano } from "../../utils/adjuntos";

// Visor de un adjunto de la OT con flechas para pasar al anterior y al siguiente.
//  items: lista donde se navega · indice: el que se ve · urlDe(item): { url, liberar }
function AdjuntoVisor({ items, indice, urlDe, onCambiar, onCerrar }) {
  const item = items[indice];
  const [vista, setVista] = useState(null);      // { url } del archivo que se ve
  const [error, setError] = useState(false);

  // Baja el archivo del adjunto actual y libera la dirección al cambiar o cerrar
  useEffect(() => {
    if (!item) return undefined;
    let vivo = true;
    let liberar = () => {};
    setVista(null);
    setError(false);
    urlDe(item)
      .then((r) => { liberar = r.liberar; if (vivo) setVista(r); else r.liberar(); })
      .catch(() => { if (vivo) setError(true); });
    return () => { vivo = false; liberar(); };
  }, [item?.id]);

  // Teclado: Esc cierra, flechas navegan
  useEffect(() => {
    const tecla = (e) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowLeft" && indice > 0) onCambiar(indice - 1);
      if (e.key === "ArrowRight" && indice < items.length - 1) onCambiar(indice + 1);
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [indice, items.length, onCambiar, onCerrar]);

  if (!item) return null;

  const descargar = () => {
    const a = document.createElement("a");
    a.href = vista.url;
    a.download = item.nombre || "adjunto";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const imprimir = () => {
    const frame = document.createElement("iframe");
    frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(frame);
    const doc = frame.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`<html><head><title>${item.nombre}</title></head><body style="margin:0;text-align:center;"><img src="${vista.url}" style="max-width:100%;" onload="window.focus();window.print();" /></body></html>`);
    doc.close();
    setTimeout(() => { if (frame.parentNode) frame.parentNode.removeChild(frame); }, 60000);
  };

  const flecha = (lado, deshabilitada, onClick, Icono) => (
    <button type="button" onClick={onClick} disabled={deshabilitada} aria-label={lado}
      style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.9)', color: 'var(--primary)', cursor: deshabilitada ? 'default' : 'pointer', opacity: deshabilitada ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icono size={22} />
    </button>
  );

  const botonAccion = { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600 };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '20px' }} onClick={onCerrar}>
      {flecha("Anterior", indice === 0, (e) => { e.stopPropagation(); onCambiar(indice - 1); }, ChevronLeft)}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', width: '90vw', maxWidth: '1000px', height: '88vh', display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.nombre} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>· {formatoTamano(item.tamano)} · {indice + 1} de {items.length}</span>
          </span>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', lineHeight: 0 }}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {error ? <span style={{ color: 'var(--muted)' }}>No se pudo abrir el archivo.</span>
            : !vista ? <span style={{ color: 'var(--muted)' }}>Cargando…</span>
            : esPdf(item.tipo)
              ? <iframe src={vista.url} title={item.nombre} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '6px', background: '#fff' }} />
              : <img src={vista.url} alt={item.nombre} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '6px' }} />}
        </div>
        {vista && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            {!esPdf(item.tipo) && <button type="button" onClick={imprimir} style={{ ...botonAccion, background: '#0D9488' }}><Printer size={14} /> Imprimir</button>}
            <button type="button" onClick={descargar} style={{ ...botonAccion, background: 'var(--primary)' }}><Download size={14} /> Descargar</button>
          </div>
        )}
      </div>
      {flecha("Siguiente", indice === items.length - 1, (e) => { e.stopPropagation(); onCambiar(indice + 1); }, ChevronRight)}
    </div>,
    document.body
  );
}

export default AdjuntoVisor;
