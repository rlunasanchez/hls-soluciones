import { Edit, Trash2 } from "lucide-react";

function EquipoCard({ equipo, onEditar, onEliminar }) {
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
      <div className="data-card-row">
        <span className="data-card-label">Serie</span>
        <span className="data-card-value">{equipo.serie || '-'}</span>
      </div>
      <div className="data-card-row">
        <span className="data-card-label">Cliente</span>
        <span className="data-card-value">{equipo.cliente_nombre || '-'}</span>
      </div>
      {equipo.averia && (
        <div className="data-card-row">
          <span className="data-card-label">Avería</span>
          <span className="data-card-value">{equipo.averia}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button className="table-btn edit-btn" onClick={() => onEditar(equipo)} style={{ flex: 1, justifyContent: 'center' }}>
          <Edit size={14} /> Editar
        </button>
        <button className="table-btn delete-btn" onClick={() => onEliminar(equipo.id)} style={{ flex: 1, justifyContent: 'center' }}>
          <Trash2 size={14} /> Eliminar
        </button>
      </div>
    </div>
  );
}

export default EquipoCard;
