import { useNavigate } from "react-router-dom";
import ClienteAcciones from "./ClienteAcciones";
import api from "../../services/api";

function ClienteLista({ clientes, onVer, onEditar, onEliminar }) {
  const navigate = useNavigate();

  // Botón OT: lleva a la OT lo marcado "En la OT" y desmarca los checks (un solo uso)
  const irAOT = async (c) => {
    try { await api.post(`/api/clientes/${c.id}/limpiar-a-ot`); } catch { /* si falla, igual se abre la OT */ }
    navigate("/orden-trabajo", { state: { cliente: c } });
  };

  return (
    <>
      {/* Vista tabla desktop */}
      <div className="table-wrapper tabla-clientes">
        <table>
          <thead>
            <tr>
              <th>Razón social</th>
              <th>RUT</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>{c.razon_social}</td>
                <td>{c.rut}</td>
                <td>{c.telefono}</td>
                <td>{c.email}</td>
                <td>
                  <ClienteAcciones
                    cliente={c}
                    onVer={onVer}
                    onEditar={onEditar}
                    onEliminar={onEliminar}
                    onOT={() => irAOT(c)}
                    onCotizacion={() => navigate("/cotizaciones", { state: { cliente: c } })}
                  />
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
                {c.razon_social}
              </strong>
              <span className="badge-rut">{c.rut}</span>
            </div>
            <div className="data-card-row">
              <span className="label">Teléfono</span>
              <span className="value">{c.telefono}</span>
            </div>
            <div className="data-card-row">
              <span className="label">Email</span>
              <span className="value">{c.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <ClienteAcciones
                cliente={c}
                onVer={onVer}
                onEditar={onEditar}
                onEliminar={onEliminar}
                onOT={() => irAOT(c)}
                onCotizacion={() => navigate("/cotizaciones", { state: { cliente: c } })}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default ClienteLista;
