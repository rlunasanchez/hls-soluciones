import { RotateCcw } from "lucide-react";
import { upperInput } from "../../utils/helpers";

function FiltrosEquipo({ filtroModelo, onFiltroModeloChange, onLimpiar }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <div className="filtro-grupo-equipos">
          <label>Modelo</label>
          <input
            type="text"
            placeholder="Modelo..."
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
