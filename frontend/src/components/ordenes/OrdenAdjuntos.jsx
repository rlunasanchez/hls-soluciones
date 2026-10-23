import { useState } from "react";
import { ChevronDown, ChevronUp, Paperclip, FileText, X } from "lucide-react";
import AdjuntoVisor from "./AdjuntoVisor";
import { LIMITES, esImagen, esPdf, dataUrlDe } from "../../utils/adjuntos";

// Apartado "Adjuntos" de la OT: hasta 10 imágenes y 10 PDF. Plegado por defecto; al abrirlo muestra
// miniaturas pequeñas en una cuadrícula de altura fija (con scroll si hay muchas), de modo que
// muchos archivos no agrandan la pantalla. Un clic abre el visor con flechas para recorrerlos.
// `adjuntos` es lo que devuelve useAdjuntosOrden.
function OrdenAdjuntos({ adjuntos, readOnly = false }) {
  const { items, cuenta, ocupado, puedeAgregar, agregar, eliminar, urlDe } = adjuntos;
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState("todos");          // todos | imagenes | pdf
  const [verIndice, setVerIndice] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);

  const visibles = items.filter((i) => filtro === "todos" || (filtro === "pdf" ? esPdf(i.tipo) : esImagen(i.tipo)));
  const resumen = items.length === 0 ? "Sin archivos"
    : [cuenta.imagenes && `${cuenta.imagenes} ${cuenta.imagenes === 1 ? "imagen" : "imágenes"}`, cuenta.pdfs && `${cuenta.pdfs} PDF`].filter(Boolean).join(" · ");

  const elegir = (e) => {
    if (e.target.files?.length) agregar(e.target.files);
    e.target.value = "";
  };
  const soltar = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (!readOnly && puedeAgregar && e.dataTransfer.files?.length) agregar(e.dataTransfer.files);
  };
  const quitar = (e, item) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar el archivo "${item.nombre}"?`)) eliminar(item);
  };

  const chip = (valor, texto) => (
    <button key={valor} type="button" onClick={() => setFiltro(valor)}
      style={{ border: '1px solid var(--border)', background: filtro === valor ? 'var(--primary)' : '#fff', color: filtro === valor ? '#fff' : 'var(--text)', borderRadius: '12px', padding: '1px 9px', fontSize: '.68rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
      {texto}
    </button>
  );

  return (
    <>
      <div style={{ marginTop: '10px', padding: '4px 10px', background: '#EFF6FF', border: `1px solid ${arrastrando ? 'var(--primary)' : '#BFDBFE'}`, borderRadius: '8px', lineHeight: '1.2' }}
        onDragOver={(e) => { if (!readOnly && puedeAgregar) { e.preventDefault(); setArrastrando(true); } }}
        onDragLeave={() => setArrastrando(false)} onDrop={soltar}>
        <button type="button" onClick={() => setAbierto(!abierto)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit' }}>
          {abierto ? <ChevronUp size={14} style={{ color: 'var(--primary)' }} /> : <ChevronDown size={14} style={{ color: 'var(--primary)' }} />}
          <Paperclip size={14} style={{ color: 'var(--primary)' }} />
          Adjuntos
          <span style={{ fontWeight: 400, fontSize: '.72rem', color: 'var(--muted)' }}>· {resumen}</span>
          {ocupado && <span style={{ fontWeight: 400, fontSize: '.72rem', color: 'var(--primary)' }}>· Subiendo…</span>}
        </button>

        {abierto && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {items.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {chip("todos", `Todos ${items.length}`)}
                {chip("imagenes", `Imágenes ${cuenta.imagenes}/${LIMITES.maxImagenes}`)}
                {chip("pdf", `PDF ${cuenta.pdfs}/${LIMITES.maxPdfs}`)}
              </div>
            )}

            {visibles.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))', gap: '6px', maxHeight: '156px', overflowY: 'auto', padding: '2px' }}>
                {visibles.map((item, idx) => {
                  const miniatura = item.miniatura || (esImagen(item.tipo) && item.data ? dataUrlDe(item) : null);
                  return (
                    <div key={item.id} onClick={() => setVerIndice(idx)} title={item.nombre} role="button" tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter") setVerIndice(idx); }}
                      style={{ position: 'relative', cursor: 'pointer', textAlign: 'center', minWidth: 0 }}>
                      <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '6px', border: '1px solid var(--border)', background: esPdf(item.tipo) ? '#FEF2F2' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {esPdf(item.tipo) ? <FileText size={26} style={{ color: '#DC2626' }} />
                          : miniatura ? <img src={miniatura} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Paperclip size={22} style={{ color: 'var(--muted)' }} />}
                      </div>
                      <div style={{ fontSize: '.62rem', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</div>
                      {!readOnly && item.kind !== "antiguo" && (
                        <button type="button" onClick={(e) => quitar(e, item)} aria-label={`Eliminar ${item.nombre}`}
                          style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', lineHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!readOnly && puedeAgregar && (
              <label className="ot-search" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--muted)', minHeight: '26px', margin: 0 }}>
                <Paperclip size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '.78rem' }}>Agregar archivos (o arrástralos aquí) · hasta {LIMITES.maxImagenes} imágenes y {LIMITES.maxPdfs} PDF</span>
                <input type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,.pdf,application/pdf" onChange={elegir} style={{ display: 'none' }} />
              </label>
            )}
            {!readOnly && !puedeAgregar && <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>Se alcanzó el máximo de archivos.</span>}
            {readOnly && items.length === 0 && <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>Sin archivos.</span>}
          </div>
        )}
      </div>

      {verIndice !== null && (
        <AdjuntoVisor items={visibles} indice={Math.min(verIndice, visibles.length - 1)} urlDe={urlDe}
          onCambiar={setVerIndice} onCerrar={() => setVerIndice(null)} />
      )}
    </>
  );
}

export default OrdenAdjuntos;
