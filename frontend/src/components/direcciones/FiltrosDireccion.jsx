import { RotateCcw, Plus } from "lucide-react";
import Pagination from "../Pagination";
import { upperInput } from "../../utils/helpers";

function FiltrosDireccion({ filtroDireccion, onFiltroDireccionChange, onLimpiar, onNuevo, paginaActual, totalPaginas, onPageChange }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <button className="main-btn" onClick={onNuevo}>
          <Plus size={16} /> Nueva Dirección
        </button>
        <div className="filtro-grupo-direcciones">
          <input
            type="text"
            placeholder="Dirección"
            aria-label="Dirección"
            value={filtroDireccion}
            onChange={(e) => onFiltroDireccionChange(upperInput(e))}
          />
        </div>
        <button onClick={onLimpiar} className="btn-limpiar-direcciones">
          <RotateCcw size={14} /> Limpiar
        </button>
        <Pagination enLinea currentPage={paginaActual} totalPages={totalPaginas} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

export default FiltrosDireccion;
