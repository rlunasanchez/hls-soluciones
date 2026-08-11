import EquipoAcciones from "./EquipoAcciones";

function EquipoCard({ equipo, onVer, onEditar, onEliminar }) {
  return (
    <div key={equipo.id} className="data-card">
      <div className="data-card-header">
        <strong>{equipo.codigo || equipo.equipo}</strong>
        <span className="badge badge-info">{equipo.marca} {equipo.modelo}</span>
      </div>
      <div className="data-card-row">
        <span className="data-card-label">Equipo</span>
        <span className="data-card-value">{equipo.equipo}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <EquipoAcciones equipo={equipo} onVer={onVer} onEditar={onEditar} onEliminar={onEliminar} />
      </div>
    </div>
  );
}

export default EquipoCard;
