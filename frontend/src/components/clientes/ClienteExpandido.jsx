import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import ClienteExpandidoAcciones from "./ClienteExpandidoAcciones";

const LIMITE_OTS = 1;

function ClienteExpandido({ cliente, ordenes, onEditar, onEliminar, onEliminarOT }) {
  const navigate = useNavigate();
  const ots = ordenes || [];
  const [mostrarOTs, setMostrarOTs] = useState(true);
  const [otsExpandidos, setOtsExpandidos] = useState(false);

  useEffect(() => { setOtsExpandidos(false); }, [ots.length]);

  const otsPag = ots.slice(0, otsExpandidos ? ots.length : LIMITE_OTS);

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
          <ClienteExpandidoAcciones
            cliente={cliente}
            onNuevaOT={() => navigate("/orden-trabajo", { state: { cliente } })}
            onEditar={onEditar}
            onEliminar={onEliminar}
          />
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

      {/* OTs Asociadas */}
      <div className="cliente-ots">
        <div className="ots-header">
          <h4>
            <ClipboardList size={12} />
            Órdenes de Trabajo ({ots.length})
          </h4>
          <div className="ots-header-actions">
            <button
              className="btn-nueva-ot"
              onClick={() =>
                navigate("/orden-trabajo", { state: { cliente } })
              }
            >
              <Plus size={10} /> Nueva OT
            </button>
            {ots.length > LIMITE_OTS && (
              <button className="btn-ver-mas-ots" onClick={() => setOtsExpandidos(!otsExpandidos)}>
                {otsExpandidos ? "Ver menos" : `Ver todas (${ots.length})`}
              </button>
            )}
            <button className="btn-toggle-seccion" onClick={() => setMostrarOTs(!mostrarOTs)} title={mostrarOTs ? "Ocultar órdenes" : "Mostrar órdenes"}>
              {mostrarOTs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {mostrarOTs && ots.length > 0 && (
          <>
            <div className="ots-tabla-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>N° OT</th>
                    <th>Fecha</th>
                    <th>Equipo</th>
                    <th>Técnico</th>
                    <th>Actividad</th>
                    <th>Observaciones</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {otsPag.map((ot) => (
                    <tr key={ot.id}>
                      <td>
                        <span className="ot-numero">{ot.numero_orden?.split("-").pop()}</span>
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
                      <td title={ot.actividad || ""}>{ot.actividad || "-"}</td>
                      <td title={ot.observaciones || ""}>{ot.observaciones || "-"}</td>
                      <td className="acciones">
                        <button
                          onClick={() =>
                            navigate("/orden-trabajo", { state: { orden: ot } })
                          }
                          title="Editar OT"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => onEliminarOT(ot.id)}
                          title="Eliminar OT"
                          className="btn-eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ClienteExpandido;
