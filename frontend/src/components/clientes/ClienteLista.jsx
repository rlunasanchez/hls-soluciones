import { useNavigate } from "react-router-dom";
import ClienteAcciones from "./ClienteAcciones";

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
                  <ClienteAcciones
                    cliente={c}
                    onVer={onVer}
                    onEditar={onEditar}
                    onEliminar={onEliminar}
                    onOT={() => navigate("/orden-trabajo", { state: { cliente: c } })}
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <ClienteAcciones
                cliente={c}
                onVer={onVer}
                onEditar={onEditar}
                onEliminar={onEliminar}
                onOT={() => navigate("/orden-trabajo", { state: { cliente: c } })}
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
