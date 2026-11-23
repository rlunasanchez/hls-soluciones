import { RotateCcw, Plus } from "lucide-react";
import Pagination from "../Pagination";
import "../../styles/Contactos.css";

// Barra de filtros de Cotizaciones, igual a la de los mantenedores: botón de nueva, filtros con su nombre
// dentro del recuadro, Limpiar y la paginación, todo en la misma fila.
function FiltrosCotizacion({ filtroFolio, onFiltroFolioChange, filtroCliente, onFiltroClienteChange, onLimpiar, onNueva, paginaActual, totalPaginas, onPageChange }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <button className="main-btn" onClick={onNueva}>
          <Plus size={16} /> Nueva Cotización
        </button>
        <div className="filtro-grupo-contactos">
          <input
            type="text"
            placeholder="Folio"
            aria-label="Folio"
            value={filtroFolio}
            onChange={(e) => onFiltroFolioChange(e.target.value)}
          />
        </div>
        <div className="filtro-grupo-contactos">
          <input
            type="text"
            placeholder="Cliente"
            aria-label="Cliente"
            value={filtroCliente}
            onChange={(e) => onFiltroClienteChange(e.target.value)}
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

export default FiltrosCotizacion;
