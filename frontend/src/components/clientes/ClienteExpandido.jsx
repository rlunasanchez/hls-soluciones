import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, Edit, Trash2, Package } from "lucide-react";
import api from "../../services/api";

function ClienteExpandido({ cliente, ordenes, onEditar, onEliminar, onEliminarOT }) {
  const navigate = useNavigate();
  const ots = ordenes || [];
  const [equipos, setEquipos] = useState([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);

  useEffect(() => {
    if (cliente?.id) {
      setLoadingEquipos(true);
      api.get(`/api/equipos?cliente_id=${cliente.id}`)
        .then((res) => setEquipos(res.data))
        .catch((err) => console.error("Error al cargar equipos:", err))
        .finally(() => setLoadingEquipos(false));
    }
  }, [cliente?.id]);

  return (
    <div className="cliente-expandido">
      {/* Header */}
      <div className="cliente-exp-header">
        <div className="cliente-info">
          <h3>
            {cliente.codigo ? `${cliente.codigo} - ` : ""}
            {cliente.razon_social}
          </h3>
          <p>
            RUT: {cliente.rut || "N/A"} | {cliente.ciudad}
            {cliente.comuna ? `, ${cliente.comuna}` : ""}
          </p>
        </div>
        <div className="cliente-acciones">
          <button
            className="btn-nueva-ot-header"
            onClick={() =>
              navigate("/orden-trabajo", { state: { cliente } })
            }
          >
            <ClipboardList size={14} /> Agregar OT
          </button>
          <button className="btn-editar-header" onClick={() => onEditar(cliente)}>
            <Edit size={14} /> Editar
          </button>
          <button
            className="btn-eliminar-header"
            onClick={() => onEliminar(cliente.id)}
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      </div>

      {/* Datos */}
      <div className="cliente-datos">
        <div className="dato-item">
          <label>Dirección</label>
          <p>{cliente.direccion || "-"}</p>
        </div>
        <div className="dato-item">
          <label>Teléfono</label>
          <p>{cliente.telefono || "-"}</p>
        </div>
        <div className="dato-item">
          <label>Contacto</label>
          <p>{cliente.contacto_nombre || "-"}</p>
          <p className="contacto-email">
            {cliente.contacto_email || cliente.contacto_fono || ""}
          </p>
        </div>
      </div>

      {/* Equipos Asociados */}
      <div className="cliente-ots">
        <div className="ots-header">
          <h4>
            <Package size={18} />
            Equipos Asociados ({equipos.length})
          </h4>
        </div>
        {loadingEquipos ? (
          <div className="ots-vacio"><p>Cargando equipos...</p></div>
        ) : equipos.length > 0 ? (
          <div className="ots-tabla-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Equipo</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Serie</th>
                </tr>
              </thead>
              <tbody>
                {equipos.map((eq) => (
                  <tr key={eq.id}>
                    <td><span className="ot-numero">{eq.codigo}</span></td>
                    <td>{eq.equipo || "-"}</td>
                    <td>{eq.marca || "-"}</td>
                    <td>{eq.modelo || "-"}</td>
                    <td>{eq.serie || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ots-vacio">
            <Package size={32} />
            <p>Este cliente no tiene equipos asociados</p>
          </div>
        )}
      </div>

      {/* OTs Asociadas */}
      <div className="cliente-ots">
        <div className="ots-header">
          <h4>
            <ClipboardList size={18} />
            Órdenes de Trabajo ({ots.length})
          </h4>
          <button
            className="btn-nueva-ot"
            onClick={() =>
              navigate("/orden-trabajo", { state: { cliente } })
            }
          >
            <Plus size={14} /> Nueva OT
          </button>
        </div>

        {ots.length > 0 ? (
          <div className="ots-tabla-wrapper">
            <table>
              <thead>
                <tr>
                  <th>N° OT</th>
                  <th>Fecha</th>
                  <th>Equipo</th>
                  <th>Técnico</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ots.map((ot) => (
                  <tr key={ot.id}>
                    <td>
                      <span className="ot-numero">{ot.numero_orden}</span>
                    </td>
                    <td>
                      {ot.fecha
                        ? new Date(ot.fecha).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {ot.equipo} {ot.marca}
                    </td>
                    <td>{ot.tecnico_asignado || "-"}</td>
                    <td className="acciones">
                      <button
                        onClick={() =>
                          navigate("/orden-trabajo", { state: { orden: ot } })
                        }
                        title="Editar OT"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onEliminarOT(ot.id)}
                        title="Eliminar OT"
                        className="btn-eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ots-vacio">
            <ClipboardList size={32} />
            <p>Este cliente no tiene órdenes de trabajo</p>
            <button
              className="btn-crear-primera"
              onClick={() =>
                navigate("/orden-trabajo", { state: { cliente } })
              }
            >
              <ClipboardList size={16} /> Crear primera OT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClienteExpandido;
