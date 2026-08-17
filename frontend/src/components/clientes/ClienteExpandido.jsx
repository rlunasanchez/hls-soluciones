import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, Edit, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import ClienteExpandidoAcciones from "./ClienteExpandidoAcciones";

function Paginacion({ pagina, totalPaginas, setPagina }) {
  if (totalPaginas <= 1) return null;
  return (
    <div className="paginacion-cliente">
      <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>
        <ChevronLeft size={12} />
      </button>
      {(() => {
        const maxVisibles = 7;
        const pages = [];
        let start = Math.max(1, pagina - Math.floor(maxVisibles / 2));
        let end = Math.min(totalPaginas, start + maxVisibles - 1);
        if (end - start + 1 < maxVisibles) {
          start = Math.max(1, end - maxVisibles + 1);
        }
        if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
        for (let i = start; i <= end; i++) pages.push(i);
        if (end < totalPaginas) { if (end < totalPaginas - 1) pages.push("..."); pages.push(totalPaginas); }
        return pages.map((p, idx) =>
          p === "..." ? <span key={"e" + idx} className="paginacion-puntos">...</span> : (
            <button key={p} className={pagina === p ? "activo" : ""} onClick={() => setPagina(p)}>
              {p}
            </button>
          )
        );
      })()}
      <button disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>
        <ChevronRight size={12} />
      </button>
    </div>
  );
}

function ClienteExpandido({ cliente, ordenes, onEditar, onEliminar, onEliminarOT }) {
  const navigate = useNavigate();
  const ots = ordenes || [];
  const [mostrarOTs, setMostrarOTs] = useState(true);
  const [pagOTs, setPagOTs] = useState(1);
  const ITEMS_POR_PAG = 4;

  useEffect(() => { setPagOTs(1); }, [ots.length]);

  const otsPag = ots.slice((pagOTs - 1) * ITEMS_POR_PAG, pagOTs * ITEMS_POR_PAG);
  const totalPagOTs = Math.ceil(ots.length / ITEMS_POR_PAG);

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
            <Paginacion pagina={pagOTs} totalPaginas={totalPagOTs} setPagina={setPagOTs} />
          </>
        )}
      </div>
    </div>
  );
}

export default ClienteExpandido;
