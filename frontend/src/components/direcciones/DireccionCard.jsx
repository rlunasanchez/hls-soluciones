import DireccionAcciones from "./DireccionAcciones";

function DireccionCard({ direccion, onVer, onEditar, onEliminar }) {
  return (
    <div key={direccion.id} className="data-card">
      <div className="data-card-header">
        <strong>{direccion.codigo || direccion.direccion}</strong>
        {direccion.comuna && <span className="badge badge-info">{direccion.comuna}</span>}
      </div>
      <div className="data-card-row">
        <span className="data-card-label">Dirección</span>
        <span className="data-card-value">{direccion.direccion}</span>
      </div>
      {direccion.ciudad && (
        <div className="data-card-row">
          <span className="data-card-label">Ciudad</span>
          <span className="data-card-value">{direccion.ciudad}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <DireccionAcciones direccion={direccion} onVer={onVer} onEditar={onEditar} onEliminar={onEliminar} />
      </div>
    </div>
  );
}

export default DireccionCard;
