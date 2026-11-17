import { RotateCcw, Plus } from "lucide-react";
import { upperInput } from "../../utils/helpers";

function FiltrosContacto({ filtroNombre, onFiltroNombreChange, onLimpiar, onNuevo }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <button className="main-btn" onClick={onNuevo}>
          <Plus size={16} /> Nuevo Contacto
        </button>
        <div className="filtro-grupo-contactos">
          <label>Nombre</label>
          <input
            type="text"
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
