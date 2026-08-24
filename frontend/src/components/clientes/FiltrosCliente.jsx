import { Search, RotateCcw } from "lucide-react";
import { formatearRutInput } from "../../utils/helpers";

function FiltrosCliente({ busqueda, onBusquedaChange, filtroRut, onFiltroRutChange, onLimpiar }) {
  return (
    <div className="filtros-cliente">
      <div className="filtro-grupo">
        <label>
          <Search size={12} /> Razón Social
        </label>
        <input
          type="text"
          placeholder="Filtrar por razón social..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
        />
      </div>
      <div className="filtro-grupo">
        <label>RUT</label>
        <input
          type="text"
          placeholder="Filtrar por RUT..."
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
