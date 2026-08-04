import { RotateCcw } from "lucide-react";

function FiltrosEquipo({ filtroModelo, onFiltroModeloChange, filtroSerie, onFiltroSerieChange, onLimpiar }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <div className="filtro-grupo-equipos">
          <label>Modelo</label>
          <input
            type="text"
            placeholder="Modelo..."
            value={filtroModelo}
            onChange={(e) => onFiltroModeloChange(e.target.value.toUpperCase())}
          />
        </div>
        <div className="filtro-grupo-equipos">
          <label>Serie</label>
          <input
            type="text"
            placeholder="Serie..."
            value={filtroSerie}
            onChange={(e) => onFiltroSerieChange(e.target.value.toUpperCase())}
          />
        </div>
        <button onClick={onLimpiar} className="btn-limpiar-equipos">
          <RotateCcw size={14} /> Limpiar
        </button>
      </div>
    </div>
  );
}

export default FiltrosEquipo;
