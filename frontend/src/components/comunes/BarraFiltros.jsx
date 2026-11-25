import { RotateCcw, Plus } from "lucide-react";
import Pagination from "../Pagination";
import "../../styles/filtros.css";

// Barra de filtros de todos los listados (Clientes, Contactos, Direcciones, Equipos, Cotizaciones y Usuarios), en una
// sola fila dentro del recuadro blanco: botones de acción, filtros con su nombre dentro del campo, Limpiar y la
// paginación. Reemplaza a las seis barras Filtros* que había, casi idénticas.
//  - acciones: [{ texto, onClick, Icono }] (Icono por defecto: Plus).
//  - campos:   [{ valor, onChange, placeholder, transformar }]; onChange recibe el texto y `transformar(e)` lo prepara
//    (por ejemplo upperInput para mayúsculas o el formato del RUT); sin él se usa el texto tal cual.
function BarraFiltros({ acciones, campos, onLimpiar, paginaActual, totalPaginas, onPageChange }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        {acciones.map(({ texto, onClick, Icono = Plus }) => (
          <button key={texto} className="main-btn" onClick={onClick}>
            <Icono size={16} /> {texto}
          </button>
        ))}
        {campos.map(({ valor, onChange, placeholder, transformar }) => (
          <div key={placeholder} className="filtro-campo">
            <input
              type="text"
              placeholder={placeholder}
              aria-label={placeholder}
              value={valor}
              onChange={(e) => onChange(transformar ? transformar(e) : e.target.value)}
            />
          </div>
        ))}
        <button onClick={onLimpiar} className="btn-limpiar" title="Limpiar filtros">
          <RotateCcw size={14} /> Limpiar
        </button>
        <Pagination enLinea currentPage={paginaActual} totalPages={totalPaginas} onPageChange={onPageChange} />
      </div>
    </div>
  );
}

export default BarraFiltros;
