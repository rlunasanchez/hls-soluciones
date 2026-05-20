import { ClipboardList, FileText, FileSpreadsheet, Edit, Trash2 } from "lucide-react";

function OrdenLista({ ordenes, loading, filtroNumeroOrden, onFiltroChange, filtroGarantia, onFiltroGarantiaChange, onNueva, pagination, onPageChange, onEditar, onEliminar, onInforme, onCotizacion }) {
  const ordenesFiltradas = ordenes.filter((orden) => {
    if (filtroNumeroOrden && !orden.numero_orden?.toLowerCase().includes(filtroNumeroOrden.toLowerCase())) return false;
    if (filtroGarantia !== "todos") {
      if (filtroGarantia === "si" && !orden.es_garantia) return false;
      if (filtroGarantia === "no" && orden.es_garantia) return false;
    }
    return true;
  });

  return (
    <>
      <div className="table-header">
        <div className="table-header-actions">
          <input
            type="text"
            placeholder="Buscar por N° de Orden..."
            value={filtroNumeroOrden}
            onChange={(e) => onFiltroChange(e.target.value)}
            className="filtro-orden-input"
          />
          <select
            value={filtroGarantia}
            onChange={(e) => onFiltroGarantiaChange(e.target.value)}
            className="filtro-garantia-select"
          >
            <option value="todos">Todas</option>
            <option value="si">Garantía</option>
            <option value="no">No garantía</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <p>Cargando órdenes...</p>
        </div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <p>{ordenes.length === 0 ? "No hay órdenes de trabajo" : `No hay órdenes que coincidan con la búsqueda`}</p>
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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.map((orden) => (
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
                    <td data-label="Acciones">
                      <div className="action-buttons">
                        <button className="table-btn" style={{ background: '#EA580C', color: 'white' }} onClick={() => onInforme(orden)}>
                          <FileText size={14} /> Informe
                        </button>
                        <button className="table-btn" style={{ background: '#DB2777', color: 'white' }} onClick={() => onCotizacion(orden)}>
                          <FileSpreadsheet size={14} /> Cotización
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
            {ordenesFiltradas.map((orden) => (
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
                <div className="action-buttons" style={{ justifyContent: 'center' }}>
                  <button className="table-btn" style={{ flex: 1, background: '#EA580C', color: 'white' }} onClick={() => onInforme(orden)}>
                    <FileText size={14} /> Informe
                  </button>
                  <button className="table-btn" style={{ flex: 1, background: '#DB2777', color: 'white' }} onClick={() => onCotizacion(orden)}>
                    <FileSpreadsheet size={14} /> Cotización
                  </button>
                  <button className="table-btn edit-btn" style={{ flex: 1 }} onClick={() => onEditar(orden)}>
                    <Edit size={14} /> Editar
                  </button>
                  <button className="table-btn delete-btn" style={{ flex: 1 }} onClick={() => onEliminar(orden.id)}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <div className="pagination-info">
              Mostrando {ordenes.length} de {pagination.totalItems} órdenes
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn-nav"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                ‹
              </button>
              <span className="page-numbers-desktop">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const num = i + 1;
                  return (
                    <button
                      key={num}
                      onClick={() => onPageChange(num)}
                      className={pagination.currentPage === num ? "active" : ""}
                    >
                      {num}
                    </button>
                  );
                })}
              </span>
              <button
                className="page-btn-nav"
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                ›
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default OrdenLista;
