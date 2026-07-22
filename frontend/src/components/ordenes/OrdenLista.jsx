import { ClipboardList, FileText, FileSpreadsheet, Edit, Trash2, Plus, Eye } from "lucide-react";
import Pagination from "../Pagination";

function OrdenLista({ ordenes, loading, filtroNumeroOrden, onFiltroChange, filtroGarantia, onFiltroGarantiaChange, filtroEstado, onFiltroEstadoChange, filtroFechaDesde, onFiltroFechaDesdeChange, filtroFechaHasta, onFiltroFechaHastaChange, onNueva, paginaActual, totalPaginas, onPageChange, onVer, onEditar, onEliminar, onInforme, onCotizacion }) {

  return (
    <>
      <div className="table-header">
        <div className="table-header-actions">
          <button className="main-btn" onClick={onNueva} style={{ marginRight: '8px' }}>
            <Plus size={16} /> Nueva Orden
          </button>
          <div className="filtro-fila-selects">
            <div className="filtro-grupo-select">
              <label>N° de Orden</label>
              <input
                type="text"
                placeholder="Buscar..."
                value={filtroNumeroOrden}
                onChange={(e) => onFiltroChange(e.target.value)}
                className="filtro-garantia-select"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <p>Cargando órdenes...</p>
        </div>
      ) : ordenes.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <p>No hay órdenes de trabajo que coincidan con la búsqueda</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>N° Orden</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Equipo</th>
                  <th>Técnico</th>
                  <th>Garantía</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map((orden) => (
                  <tr key={orden.id}>
                    <td data-label="N° Orden">
                      <span className="codigo-badge">{orden.numero_orden}</span>
                    </td>
                    <td data-label="Fecha">
                      {orden.fecha ? new Date(orden.fecha).toLocaleDateString() : "-"}
                    </td>
                    <td data-label="Cliente">{orden.cliente}</td>
                    <td data-label="Equipo">
                      {orden.equipo} {orden.marca} {orden.modelo}
                    </td>
                    <td data-label="Técnico">{orden.tecnico_asignado}</td>
                    <td data-label="Garantía">
                      {orden.es_garantia ? (
                        <span className="badge-garantia">Sí</span>
                      ) : (
                        <span className="badge-no-garantia">No</span>
                      )}
                    </td>
                    <td data-label="Estado">
                      {orden.fecha_entrega ? (
                        <span className="badge-estado-cerrada">Cerrada</span>
                      ) : (
                        <span className="badge-estado-pendiente">Pendiente</span>
                      )}
                    </td>
                    <td data-label="Acciones">
                      <div className="action-buttons">
                        <button className="table-btn" style={{ background: '#EA580C', color: 'white' }} onClick={() => onInforme(orden)}>
                          <FileText size={14} /> Informe
                        </button>
                        <button className="table-btn" style={{ background: '#DB2777', color: 'white' }} onClick={() => onCotizacion(orden)}>
                          <FileSpreadsheet size={14} /> Cotización
                        </button>
                        <button className="table-btn ver-btn" onClick={() => onVer(orden)}>
                          <Eye size={14} /> Ver
                        </button>
                        <button className="table-btn edit-btn" onClick={() => onEditar(orden)}>
                          <Edit size={14} /> Editar
                        </button>
                        <button className="table-btn delete-btn" onClick={() => onEliminar(orden.id)}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cards-table">
            {ordenes.map((orden) => (
              <div key={orden.id} className="data-card">
                <div className="data-card-header">
                  <strong>{orden.numero_orden}</strong>
                  {orden.es_garantia ? (
                    <span className="badge-garantia">Garantía</span>
                  ) : (
                    <span className="badge-no-garantia">No garantía</span>
                  )}
                </div>
                <div className="data-card-row">
                  <span className="label">Fecha</span>
                  <span className="value">
                    {orden.fecha ? new Date(orden.fecha).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="data-card-row">
                  <span className="label">Cliente</span>
                  <span className="value">{orden.cliente}</span>
                </div>
                <div className="data-card-row">
                  <span className="label">Equipo</span>
                  <span className="value">
                    {orden.equipo} {orden.marca} {orden.modelo}
                  </span>
                </div>
                <div className="data-card-row">
                  <span className="label">Técnico</span>
                  <span className="value">{orden.tecnico_asignado}</span>
                </div>
                <div className="data-card-row">
                  <span className="label">Estado</span>
                  <span className="value">
                    {orden.fecha_entrega ? (
                      <span className="badge-estado-cerrada">Cerrada</span>
                    ) : (
                      <span className="badge-estado-pendiente">Pendiente</span>
                    )}
                  </span>
                </div>
                <div className="action-buttons">
                  <button className="table-btn" style={{ background: '#EA580C', color: 'white' }} onClick={() => onInforme(orden)}>
                    <FileText size={14} /> Informe
                  </button>
                  <button className="table-btn" style={{ background: '#DB2777', color: 'white' }} onClick={() => onCotizacion(orden)}>
                    <FileSpreadsheet size={14} /> Cotización
                  </button>
                  <button className="table-btn ver-btn" onClick={() => onVer(orden)}>
                    <Eye size={14} /> Ver
                  </button>
                  <button className="table-btn edit-btn" onClick={() => onEditar(orden)}>
                    <Edit size={14} /> Editar
                  </button>
                  <button className="table-btn delete-btn" onClick={() => onEliminar(orden.id)}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination currentPage={paginaActual} totalPages={totalPaginas} onPageChange={onPageChange} />
        </>
      )}
    </>
  );
}

export default OrdenLista;
