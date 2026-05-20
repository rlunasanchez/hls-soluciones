function FiltrosEquipo({ busqueda, onBusquedaChange, onLimpiar }) {
  return (
    <div className="filters-section">
      <div className="filters-content">
        <div className="filtro-grupo-equipos">
          <label>Buscar por Serie, Código o Cliente</label>
          <input
            type="text"
            placeholder="Serie, código (EQ-XXXX) o nombre del cliente..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
        </div>
        <button onClick={onLimpiar} className="btn-nuevo-cliente">
          Limpiar
        </button>
      </div>
    </div>
  );
}

export default FiltrosEquipo;
