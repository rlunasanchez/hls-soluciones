import { RotateCcw, Plus } from "lucide-react";
import Pagination from "../Pagination";
import { formatearRutInput } from "../../utils/helpers";

function FiltrosCliente({ busqueda, onBusquedaChange, filtroRut, onFiltroRutChange, onLimpiar, onNuevo, paginaActual, totalPaginas, onPageChange }) {
  return (
    <div className="filtros-cliente">
      <button className="main-btn" onClick={onNuevo}>
        <Plus size={16} /> Nuevo Cliente
      </button>
      <div className="filtro-grupo">
        <input
          type="text"
          placeholder="Razón Social / Nombre"
          aria-label="Razón Social / Nombre"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
        />
      </div>
      <div className="filtro-grupo">
        <input
          type="text"
          placeholder="RUT"
          aria-label="RUT"
          value={filtroRut}
          onChange={(e) => onFiltroRutChange(formatearRutInput(e.target.value))}
        />
      </div>
      <button className="btn-limpiar-equipos" onClick={onLimpiar} title="Limpiar filtros">
        <RotateCcw size={14} /> Limpiar
      </button>
      <Pagination enLinea currentPage={paginaActual} totalPages={totalPaginas} onPageChange={onPageChange} />
    </div>
  );
}

export default FiltrosCliente;
