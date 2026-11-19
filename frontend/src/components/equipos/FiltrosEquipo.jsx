import { RotateCcw, Plus } from "lucide-react";
import Pagination from "../Pagination";
import { upperInput } from "../../utils/helpers";

function FiltrosEquipo({ filtroModelo, onFiltroModeloChange, onLimpiar, onNuevo, paginaActual, totalPaginas, onPageChange }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <button className="main-btn" onClick={onNuevo}>
          <Plus size={16} /> Nuevo Equipo
        </button>
        <div className="filtro-grupo-equipos">
          <input
            type="text"
            placeholder="Modelo"
            aria-label="Modelo"
            value={filtroModelo}
            onChange={(e) => onFiltroModeloChange(upperInput(e))}
          />
        </div>
        <button onClick={onLimpiar} className="btn-limpiar-equipos">
          <RotateCcw size={14} /> Limpiar
        </button>
        <Pagination enLinea currentPage={paginaActual} totalPages={totalPaginas} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

export default FiltrosEquipo;
