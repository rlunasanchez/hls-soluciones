import { RotateCcw } from "lucide-react";
import { upperInput } from "../../utils/helpers";

function FiltrosContacto({ filtroNombre, onFiltroNombreChange, onLimpiar }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <div className="filtro-grupo-contactos">
          <label>Nombre</label>
          <input
            type="text"
            placeholder="Nombre..."
            value={filtroNombre}
            onChange={(e) => onFiltroNombreChange(upperInput(e))}
          />
        </div>
        <button onClick={onLimpiar} className="btn-limpiar-contactos">
          <RotateCcw size={14} /> Limpiar
        </button>
      </div>
    </div>
  );
}

export default FiltrosContacto;
