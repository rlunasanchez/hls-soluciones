import { useNavigate } from "react-router-dom";
import { ClipboardList, FileSpreadsheet, Edit, Trash2, Eye } from "lucide-react";

function ClienteLista({ clientes, onVer, onEditar, onEliminar }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Vista tabla desktop */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Razón Social</th>
              <th>RUT</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="codigo-badge">{c.codigo || "-"}</span>
                </td>
                <td>{c.razon_social}</td>
                <td>{c.rut}</td>
                <td>{c.telefono}</td>
                <td>{c.ciudad}</td>
                <td>{c.contacto_nombre}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="table-btn"
                      style={{ background: '#6366f1', color: 'white' }}
                      onClick={() =>
                        navigate("/orden-trabajo", { state: { cliente: c } })
                      }
                    >
                      <ClipboardList size={14} /> OT
                    </button>
                    <button
                      className="table-btn"
                      style={{ background: '#DB2777', color: 'white' }}
                      onClick={() =>
                        navigate("/cotizaciones", { state: { cliente: c } })
                      }
                    >
                      <FileSpreadsheet size={14} /> Cotización
                    </button>
                    <button
                      className="table-btn"
                      style={{ background: '#0D9488', color: 'white' }}
                      onClick={() => onVer(c)}
                    >
                      <Eye size={14} /> Ver
                    </button>
                    <button
                      className="table-btn edit-btn"
                      onClick={() => onEditar(c)}
                    >
                      <Edit size={14} /> Editar
                    </button>
                    <button
                      className="table-btn delete-btn"
                      onClick={() => onEliminar(c.id)}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista tarjetas móvil */}
      <div className="cards-table">
        {clientes.map((c) => (
          <div key={c.id} className="data-card">
            <div className="data-card-header">
              <strong>
                {c.codigo ? `${c.codigo} - ` : ""}
                {c.razon_social}
              </strong>
              <span className="badge-rut">{c.rut}</span>
            </div>
            <div className="data-card-row">
              <span className="label">Teléfono</span>
              <span className="value">{c.telefono}</span>
            </div>
            <div className="data-card-row">
              <span className="label">Ciudad</span>
              <span className="value">{c.ciudad}</span>
            </div>
            <div className="data-card-row">
              <span className="label">Contacto</span>
              <span className="value">{c.contacto_nombre}</span>
            </div>
            <div className="action-buttons">
              <button
                className="table-btn"
                style={{ background: '#6366f1', color: 'white' }}
                onClick={() =>
                  navigate("/orden-trabajo", { state: { cliente: c } })
                }
              >
                <ClipboardList size={14} /> OT
              </button>
              <button
                className="table-btn"
                style={{ background: '#DB2777', color: 'white' }}
                onClick={() =>
                  navigate("/cotizaciones", { state: { cliente: c } })
                }
              >
                <FileSpreadsheet size={14} /> Cotización
              </button>
              <button className="table-btn ver-btn" onClick={() => onVer(c)}>
                <Eye size={14} /> Ver
              </button>
              <button className="table-btn edit-btn" onClick={() => onEditar(c)}>
                <Edit size={14} /> Editar
              </button>
              <button
                className="table-btn delete-btn"
                onClick={() => onEliminar(c.id)}
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default ClienteLista;
