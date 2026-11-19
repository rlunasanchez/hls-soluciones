import { RotateCcw, Plus } from "lucide-react";
import Pagination from "../Pagination";
import { upperInput } from "../../utils/helpers";

function FiltrosContacto({ filtroNombre, onFiltroNombreChange, onLimpiar, onNuevo, paginaActual, totalPaginas, onPageChange }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <button className="main-btn" onClick={onNuevo}>
          <Plus size={16} /> Nuevo Contacto
        </button>
        <div className="filtro-grupo-contactos">
          <input
            type="text"
            placeholder="Nombre"
            aria-label="Nombre"
            value={filtroNombre}
            onChange={(e) => onFiltroNombreChange(upperInput(e))}
          />
        </div>
        <button onClick={onLimpiar} className="btn-limpiar-contactos">
          <RotateCcw size={14} /> Limpiar
        </button>
        <Pagination enLinea currentPage={paginaActual} totalPages={totalPaginas} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

export default FiltrosContacto;
