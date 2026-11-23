import { RotateCcw, Plus, Key } from "lucide-react";
import Pagination from "../Pagination";

// Barra de filtros de Usuarios, igual a la de los mantenedores: botones de acción, filtro con su nombre
// dentro del recuadro, Limpiar y la paginación, todo en la misma fila.
function FiltrosUsuario({ filtroBusqueda, onFiltroBusquedaChange, onLimpiar, onNuevo, onCambiarPassword, paginaActual, totalPaginas, onPageChange }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <button className="main-btn" onClick={onNuevo}>
          <Plus size={16} /> Nuevo Usuario
        </button>
        <button className="main-btn" onClick={onCambiarPassword}>
          <Key size={16} /> Cambiar Password
        </button>
        <div className="filtro-grupo-equipos">
          <input
            type="text"
            placeholder="Nombre o correo"
            aria-label="Nombre o correo"
            value={filtroBusqueda}
            onChange={(e) => onFiltroBusquedaChange(e.target.value)}
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

export default FiltrosUsuario;
