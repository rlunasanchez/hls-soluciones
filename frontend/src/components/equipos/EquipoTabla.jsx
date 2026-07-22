import { ChevronDown, Edit, Trash2, Eye } from "lucide-react";

function EquipoTabla({ equipos, hayBusqueda, equiposExpandidos, setEquiposExpandidos, onVer, onEditar, onEliminar }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Equipo</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Serie</th>
            <th>Cliente</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((eq) => {
            const expandido = equiposExpandidos[eq.id];
            return (
              <>
                <tr key={eq.id}>
                  <td data-label="Código">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {hayBusqueda && (
                        <span style={{ color: 'var(--primary)', transition: 'transform 0.2s', transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)', cursor: 'pointer' }}
                          onClick={() => setEquiposExpandidos(prev => ({ ...prev, [eq.id]: !prev[eq.id] }))}>
                          <ChevronDown size={16} />
                        </span>
                      )}
                      <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{eq.codigo || '-'}</span>
                    </div>
                  </td>
                  <td data-label="Equipo">{eq.equipo}</td>
                  <td data-label="Marca">{eq.marca}</td>
                  <td data-label="Modelo">{eq.modelo}</td>
                  <td data-label="Serie">{eq.serie}</td>
                  <td data-label="Cliente">{eq.cliente_codigo ? `${eq.cliente_codigo} - ${eq.cliente_nombre}` : '-'}</td>
                  <td data-label="Acciones">
                    <div className="action-buttons">
                      <button className="table-btn" style={{ background: '#0D9488', color: 'white' }} onClick={() => onVer(eq)}>
                        <Eye size={14} /> Ver
                      </button>
                      <button className="table-btn edit-btn" onClick={() => onEditar(eq)}>
                        <Edit size={14} /> Editar
                      </button>
                      <button className="table-btn delete-btn" onClick={() => onEliminar(eq.id)}>
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
                {expandido && (eq.actividad || eq.observaciones) && (
                  <tr key={eq.id + '-detail'}>
                    <td colSpan={7} style={{ padding: '8px 12px', background: 'var(--primary-light, #f0f7ff)', fontSize: '0.8rem' }}>
                      {eq.actividad && <div><strong>Actividad:</strong> {eq.actividad}</div>}
                      {eq.observaciones && <div><strong>Observaciones:</strong> {eq.observaciones}</div>}
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default EquipoTabla;
