import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { upperInput } from "../../utils/helpers";

// Notas internas de la OT (no se imprimen ni las ve el cliente). Colapsado por defecto.
function OrdenInfoInterna({ nuevaOrden, setNuevaOrden, readOnly = false }) {
  const [mostrarInfoInterna, setMostrarInfoInterna] = useState(false);
  return (
    <div style={{ marginTop: '10px', padding: '4px 10px', background: '#FEF9E7', border: '1px solid #F5D48C', borderRadius: '8px', lineHeight: '1.2' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem', width: 'fit-content', maxWidth: '100%' }}>
            <button
              type="button"
              onClick={() => setMostrarInfoInterna(!mostrarInfoInterna)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit' }}
            >
              {mostrarInfoInterna ? <ChevronUp size={14} style={{ color: '#B45309', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: '#B45309', flexShrink: 0 }} />}
              Información Interna
              {String(nuevaOrden.infoInterna || "").trim() && (
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B45309', flexShrink: 0 }} title="Tiene información interna" />
              )}
            </button>
          </label>
  
          {mostrarInfoInterna && (
            <div style={{ marginTop: '8px' }}>
              <div className="of-f">
                <textarea
                  rows={4}
                  placeholder="Notas internas de la orden (no visibles para el cliente)..."
                  value={nuevaOrden.infoInterna || ""}
                  onChange={(e) => setNuevaOrden({...nuevaOrden, infoInterna: upperInput(e)})}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '2px 8px', border: '1.5px solid var(--border)', borderRadius: '6px', fontSize: '.82rem', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
            </div>
          )}
        </div>
  );
}

export default OrdenInfoInterna;
