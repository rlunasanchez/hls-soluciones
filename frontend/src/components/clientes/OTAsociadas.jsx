import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, Edit, Trash2 } from "lucide-react";

function OTAsociadas({ cliente, ordenes, onEliminar }) {
  const navigate = useNavigate();
  const ots = ordenes || [];

  return (
    <div className="ots-asociadas">
      <div className="ots-header">
        <h4>
          <ClipboardList size={18} />
          Órdenes de Trabajo ({ots.length})
        </h4>
        <button
          className="btn-nueva-ot"
          onClick={() => navigate("/orden-trabajo", { state: { cliente } })}
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
                    {ot.fecha ? new Date(ot.fecha).toLocaleDateString() : "-"}
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
                      onClick={() => onEliminar(ot.id)}
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
  );
}

export default OTAsociadas;
