import { Search, Plus } from "lucide-react";

function FiltrosCliente({ busqueda, onBusquedaChange, filtroRut, onFiltroRutChange, onNuevo }) {
  const formatearRut = (val) => {
    let v = val.toUpperCase().replace(/[^0-9K-]/g, "");
    if (v.length > 12) v = v.slice(0, 12);
    const partes = v.split("-");
    if (partes.length === 2) {
      if (partes[1].length > 1) partes[1] = partes[1][0];
      if (partes[0].length > 0)
        partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    } else if (partes.length === 1 && partes[0].length > 0) {
      partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    }
    return partes.join("-");
  };

  return (
    <div className="filtros-cliente">
      <div className="filtro-grupo">
        <label>
          <Search size={14} /> Razón Social
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
          onChange={(e) => onFiltroRutChange(formatearRut(e.target.value))}
        />
      </div>
      {onNuevo && (
        <button className="btn-nuevo-cliente" onClick={onNuevo}>
          <Plus size={16} /> Nuevo Cliente
        </button>
      )}
    </div>
  );
}

export default FiltrosCliente;
