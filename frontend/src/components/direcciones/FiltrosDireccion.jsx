import { RotateCcw, Plus } from "lucide-react";
import { upperInput } from "../../utils/helpers";

function FiltrosDireccion({ filtroDireccion, onFiltroDireccionChange, onLimpiar, onNuevo }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <button className="main-btn" onClick={onNuevo}>
          <Plus size={16} /> Nueva Dirección
        </button>
        <div className="filtro-grupo-direcciones">
          <label>Dirección</label>
          <input
            type="text"
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
