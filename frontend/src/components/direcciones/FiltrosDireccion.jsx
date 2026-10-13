import { RotateCcw } from "lucide-react";
import { upperInput } from "../../utils/helpers";

function FiltrosDireccion({ filtroDireccion, onFiltroDireccionChange, onLimpiar }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <div className="filtro-grupo-direcciones">
          <label>Dirección</label>
          <input
            type="text"
            placeholder="Dirección..."
            value={filtroDireccion}
            onChange={(e) => onFiltroDireccionChange(upperInput(e))}
          />
        </div>
        <button onClick={onLimpiar} className="btn-limpiar-direcciones">
          <RotateCcw size={14} /> Limpiar
        </button>
      </div>
    </div>
  );
}

export default FiltrosDireccion;
