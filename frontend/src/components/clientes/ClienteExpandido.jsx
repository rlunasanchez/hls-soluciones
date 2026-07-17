import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, Edit, Trash2, Package, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../services/api";

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
  const [equipos, setEquipos] = useState([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [mostrarEquipos, setMostrarEquipos] = useState(true);
  const [mostrarOTs, setMostrarOTs] = useState(true);
  const [pagEquipos, setPagEquipos] = useState(1);
  const [pagOTs, setPagOTs] = useState(1);
  const ITEMS_POR_PAG = 4;

  useEffect(() => {
    if (cliente?.id) {
      setLoadingEquipos(true);
      api.get(`/api/equipos?cliente_id=${cliente.id}`)
        .then((res) => setEquipos(res.data))
        .catch((err) => console.error("Error al cargar equipos:", err))
        .finally(() => setLoadingEquipos(false));
    }
  }, [cliente?.id]);

  useEffect(() => { setPagEquipos(1); }, [equipos.length]);
  useEffect(() => { setPagOTs(1); }, [ots.length]);

  const equiposPag = equipos.slice((pagEquipos - 1) * ITEMS_POR_PAG, pagEquipos * ITEMS_POR_PAG);
  const otsPag = ots.slice((pagOTs - 1) * ITEMS_POR_PAG, pagOTs * ITEMS_POR_PAG);
  const totalPagEquipos = Math.ceil(equipos.length / ITEMS_POR_PAG);
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
          <button
            className="btn-nueva-ot-header"
            onClick={() =>
              navigate("/orden-trabajo", { state: { cliente } })
            }
          >
            <ClipboardList size={10} /> Agregar OT
          </button>
          <button className="btn-editar-header" onClick={() => onEditar(cliente)}>
            <Edit size={10} /> Editar
          </button>
          <button
            className="btn-eliminar-header"
            onClick={() => onEliminar(cliente.id)}
          >
            <Trash2 size={10} /> Eliminar
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
            <Package size={12} />
            Equipos Asociados ({equipos.length})
          </h4>
          <button className="btn-toggle-seccion" onClick={() => setMostrarEquipos(!mostrarEquipos)} title={mostrarEquipos ? "Ocultar equipos" : "Mostrar equipos"}>
            {mostrarEquipos ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
        {mostrarEquipos && (loadingEquipos ? (
          <div className="ots-vacio"><p>Cargando equipos...</p></div>
        ) : equipos.length > 0 ? (
          <>
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
                  {equiposPag.map((eq) => (
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
            <Paginacion pagina={pagEquipos} totalPaginas={totalPagEquipos} setPagina={setPagEquipos} />
          </>
        ) : (
          <div className="ots-vacio">
            <Package size={20} />
            <p>Este cliente no tiene equipos asociados</p>
          </div>
        ))}
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

        {mostrarOTs && (ots.length > 0 ? (
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
        ) : (
          <div className="ots-vacio">
            <ClipboardList size={20} />
            <p>Este cliente no tiene órdenes de trabajo</p>
            <button
              className="btn-crear-primera"
              onClick={() =>
                navigate("/orden-trabajo", { state: { cliente } })
              }
            >
              <ClipboardList size={12} /> Crear primera OT
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClienteExpandido;
