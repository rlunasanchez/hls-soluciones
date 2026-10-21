import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

// Dentro del bloque expandido se muestran como máximo COTIZ_VISIBLES chips; el resto queda tras un "Ver N más".
const COTIZ_VISIBLES = 3;

// Cotizaciones asociadas a la orden abierta: contador y chips que abren cada cotización.
// Se monta con key={ordenIdActual}, así vuelve a empezar colapsado al cambiar de orden.
function OrdenCotizaciones({ cotizaciones, ordenIdActual, soloLectura }) {
  const navigate = useNavigate();
  const [mostrarCotizacionesAsociadas, setMostrarCotizacionesAsociadas] = useState(false);
  const [verTodasCotizaciones, setVerTodasCotizaciones] = useState(false);
  if (cotizaciones.length === 0) return null;
  return (
    <div style={{ marginTop: '10px', padding: '4px 10px', background: '#FEF9E7', border: '1px solid #F5D48C', borderRadius: '8px', lineHeight: '1.2' }}>
      <button
        type="button"
        onClick={() => { setMostrarCotizacionesAsociadas(!mostrarCotizacionesAsociadas); setVerTodasCotizaciones(false); }}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit' }}
      >
        {mostrarCotizacionesAsociadas ? <ChevronUp size={14} style={{ color: '#B45309', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: '#B45309', flexShrink: 0 }} />}
        Cotizaciones Asociadas
        <span style={{
          background: '#B45309', color: 'white', padding: '1px 8px', borderRadius: '10px',
          fontSize: '0.75rem', fontWeight: '700'
        }}>
          {cotizaciones.length}
        </span>
      </button>

      {mostrarCotizacionesAsociadas && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '8px', alignItems: 'center' }}>
          {(verTodasCotizaciones ? cotizaciones : cotizaciones.slice(0, COTIZ_VISIBLES)).map((c) => (
            <span key={c.id}
              onClick={() => navigate('/cotizaciones', { state: { cotizacionId: c.id, cotizacionSoloLectura: soloLectura, volverOrdenId: ordenIdActual, volverOrdenSoloLectura: soloLectura } })}
              title="Ver esta cotización"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: 'var(--primary-light)', color: 'var(--primary)',
                border: '1px solid var(--primary)', borderRadius: 999,
                padding: '3px 10px', fontSize: '.75rem', fontWeight: 600
              }}
            >
              N° {c.folio}
            </span>
          ))}
          {cotizaciones.length > COTIZ_VISIBLES && (
            <button
              type="button"
              onClick={() => setVerTodasCotizaciones(!verTodasCotizaciones)}
              style={{
                background: 'none', border: 'none', padding: '3px 4px', cursor: 'pointer',
                color: '#B45309', fontSize: '.75rem', fontWeight: 700, fontFamily: 'inherit'
              }}
            >
              {verTodasCotizaciones ? 'Ver menos' : `Ver ${cotizaciones.length - COTIZ_VISIBLES} más`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default OrdenCotizaciones;
