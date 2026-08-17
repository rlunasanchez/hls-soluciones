import { Trash2 } from "lucide-react";
import { upperInput } from "../../utils/helpers";

function OrdenFormAveria({ nuevaOrden, setNuevaOrden, readOnly }) {
  return (
    <div className="of-sec muted">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span className="of-st muted">Avería/Falla/Incidencia</span>
        {!readOnly && (nuevaOrden.averia || nuevaOrden.actividad || nuevaOrden.observaciones) && (
          <button
            type="button"
            className="of-btn-a"
            onClick={() => setNuevaOrden(prev => ({ ...prev, averia: "", actividad: "", observaciones: "" }))}
          >
            <Trash2 size={14} /> Limpiar
          </button>
        )}
      </div>
      <div className="of-f">
        <textarea
          placeholder="Describa la avería, falla o incidencia del equipo..."
          value={nuevaOrden.averia}
          onChange={(e) => setNuevaOrden({...nuevaOrden, averia: upperInput(e)})}
          rows={4}
          disabled={readOnly}
        />
      </div>

      <div className="of-st muted">Actividad</div>
      <div className="of-f">
        <textarea
          placeholder="Describa la actividad realizada..."
          value={nuevaOrden.actividad}
          onChange={(e) => setNuevaOrden({...nuevaOrden, actividad: upperInput(e)})}
          rows={4}
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

export default OrdenFormAveria;