import { RotateCcw, Plus } from "lucide-react";
import { upperInput } from "../../utils/helpers";

function FiltrosEquipo({ filtroModelo, onFiltroModeloChange, onLimpiar, onNuevo }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <button className="main-btn" onClick={onNuevo}>
          <Plus size={16} /> Nuevo Equipo
        </button>
        <div className="filtro-grupo-equipos">
          <label>Modelo</label>
          <input
            type="text"
            value={filtroModelo}
            onChange={(e) => onFiltroModeloChange(upperInput(e))}
          />
        </div>
        <button onClick={onLimpiar} className="btn-limpiar-equipos">
          <RotateCcw size={14} /> Limpiar
        </button>
      </div>
    </div>
  );
}

export default FiltrosEquipo;
