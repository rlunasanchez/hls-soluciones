import { ClipboardList, Plus, RotateCcw } from "lucide-react";
import Pagination from "../Pagination";
import OrdenAcciones from "./OrdenAcciones";

function OrdenLista({ ordenes, loading, filtroNumeroOrden, onFiltroChange, filtroCliente, onFiltroClienteChange, filtroSerie, onFiltroSerieChange, filtroEstado, onFiltroEstadoChange, filtroFechaDesde, onFiltroFechaDesdeChange, filtroFechaHasta, onFiltroFechaHastaChange, onLimpiar, onNueva, paginaActual, totalPaginas, onPageChange, onVer, onEditar, onEliminar, onInforme, onCotizacion }) {

  return (
    <>
      <div className="table-header">
        <div className="table-header-actions">
          <button className="main-btn" onClick={onNueva} style={{ marginRight: '8px' }}>
            <Plus size={16} /> Nueva Orden
          </button>
          <div className="filtro-fila-selects">
            <div className="filtro-grupo-select filtro-full-width">
              <label>N° de Orden</label>
              <input
                type="text"
                placeholder="Buscar..."
                value={filtroNumeroOrden}
                onChange={(e) => onFiltroChange(e.target.value)}
                className="filtro-garantia-select"
              />
            </div>
            <div className="filtro-grupo-select">
              <label>Cliente</label>
              <input
                type="text"
                placeholder="Buscar..."
                value={filtroCliente}
                onChange={(e) => onFiltroClienteChange(e.target.value)}
                className="filtro-garantia-select"
              />
            </div>
            <div className="filtro-grupo-select">
              <label>Serie</label>
              <input
                type="text"
                placeholder="Buscar..."
                value={filtroSerie}
                onChange={(e) => onFiltroSerieChange(e.target.value)}
                className="filtro-garantia-select"
              />
            </div>
            <div className="filtro-grupo-select">
              <label>Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => onFiltroEstadoChange(e.target.value)}
                className="filtro-garantia-select"
              >
                <option value="todos">Todas</option>
                <option value="cerrada">Cerrada</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
            <div className="filtro-fechas-group">
              <div className="filtro-grupo-select">
                <label>Desde</label>
                <input
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => onFiltroFechaDesdeChange(e.target.value)}
                  className="filtro-fecha-input"
                />
              </div>
              <div className="filtro-grupo-select">
                <label>Hasta</label>
                <input
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => onFiltroFechaHastaChange(e.target.value)}
                  className="filtro-fecha-input"
                />
              </div>
            </div>
            <button onClick={onLimpiar} className="btn-limpiar-equipos" title="Limpiar filtros">
              <RotateCcw size={14} /> Limpiar
            </button>
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
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map((orden) => (
                  <tr key={orden.id}>
                    <td data-label="N° Orden">
                      <span className="codigo-badge">{orden.numero_orden?.split("-").pop()}</span>
                    </td>
                    <td data-label="Fecha">
                      {orden.fecha ? new Date(orden.fecha).toLocaleDateString() : "-"}
                    </td>
                    <td data-label="Cliente">{orden.cliente}</td>
                    <td data-label="Equipo">
                      {orden.equipo} {orden.marca} {orden.modelo}
                    </td>
                    <td data-label="Técnico">{orden.tecnico_asignado}</td>
                    <td data-label="Estado">
                      {orden.fecha_entrega ? (
                        <span className="badge-estado-cerrada">Cerrada</span>
                      ) : (
                        <span className="badge-estado-pendiente">Pendiente</span>
                      )}
                    </td>
                    <td data-label="Acciones">
                      <OrdenAcciones
                        orden={orden}
                        onVer={onVer}
                        onEditar={onEditar}
                        onEliminar={onEliminar}
                        onInforme={onInforme}
                        onCotizacion={onCotizacion}
                      />
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
                  <strong>{orden.numero_orden?.split("-").pop()}</strong>
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
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <OrdenAcciones
                    orden={orden}
                    onVer={onVer}
                    onEditar={onEditar}
                    onEliminar={onEliminar}
                    onInforme={onInforme}
                    onCotizacion={onCotizacion}
                  />
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
