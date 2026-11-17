import { Search, RotateCcw, Plus } from "lucide-react";
import { formatearRutInput } from "../../utils/helpers";

function FiltrosCliente({ busqueda, onBusquedaChange, filtroRut, onFiltroRutChange, onLimpiar, onNuevo }) {
  return (
    <div className="filtros-cliente">
      <button className="main-btn" onClick={onNuevo}>
        <Plus size={16} /> Nuevo Cliente
      </button>
      <div className="filtro-grupo">
        <label>
          <Search size={12} /> Razón Social / Nombre
        </label>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
        />
      </div>
      <div className="filtro-grupo">
        <label>RUT</label>
        <input
          type="text"
          value={filtroRut}
          onChange={(e) => onFiltroRutChange(formatearRutInput(e.target.value))}
        />
      </div>
      <button className="btn-limpiar-equipos" onClick={onLimpiar} title="Limpiar filtros">
        <RotateCcw size={14} /> Limpiar
      </button>
    </div>
  );
}

export default FiltrosCliente;
