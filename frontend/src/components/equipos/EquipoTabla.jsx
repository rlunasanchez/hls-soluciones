import { Edit, Trash2, Eye } from "lucide-react";

function EquipoTabla({ equipos, onVer, onEditar, onEliminar }) {
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
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((eq) => (
            <tr key={eq.id}>
              <td data-label="Código">
                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{eq.codigo || '-'}</span>
              </td>
              <td data-label="Equipo">{eq.equipo}</td>
              <td data-label="Marca">{eq.marca}</td>
              <td data-label="Modelo">{eq.modelo}</td>
              <td data-label="Serie">{eq.serie}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EquipoTabla;
