import { FileSpreadsheet, Plus, RotateCcw } from "lucide-react";
import Pagination from "../Pagination";
import CotizacionAcciones from "./CotizacionAcciones";
import { calcularTotales } from "../../utils/cotizacionDoc";

const clp = (n) => Math.round(Number(n) || 0).toLocaleString("es-CL");

function CotizacionLista({ cotizaciones, loading, filtroFolio, onFiltroFolioChange, filtroCliente, onFiltroClienteChange, onLimpiar, onNueva, paginaActual, totalPaginas, onPageChange, onVer, onEditar, onEliminar, onPDF }) {
  return (
    <>
      <div className="table-header">
        <div className="table-header-actions">
          <button className="main-btn" onClick={onNueva} style={{ marginRight: '8px' }}>
            <Plus size={16} /> Nueva Cotización
          </button>
          <div className="filtro-fila-selects">
            <div className="filtro-grupo-select">
              <label>Folio</label>
              <input
                type="text"
                placeholder="Buscar..."
                value={filtroFolio}
                onChange={(e) => onFiltroFolioChange(e.target.value)}
                className="filtro-garantia-select"
              />
            </div>
            <div className="filtro-grupo-select filtro-full-width">
              <label>Cliente</label>
              <input
                type="text"
                placeholder="Buscar..."
                value={filtroCliente}
                onChange={(e) => onFiltroClienteChange(e.target.value)}
                className="filtro-garantia-select"
              />
            </div>
            <button onClick={onLimpiar} className="btn-limpiar-equipos" title="Limpiar filtros">
              <RotateCcw size={14} /> Limpiar
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <FileSpreadsheet size={48} />
          <p>Cargando cotizaciones...</p>
        </div>
      ) : cotizaciones.length === 0 ? (
        <div className="empty-state">
          <FileSpreadsheet size={48} />
          <p>No hay cotizaciones que coincidan con la búsqueda</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cliente</th>
                  <th>Emisión</th>
                  <th>Ejecutivo</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((cot) => (
                  <tr key={cot.id}>
                    <td data-label="Folio"><span className="codigo-badge">{cot.folio}</span></td>
                    <td data-label="Cliente">{cot.cliente_razon_social}</td>
                    <td data-label="Emisión">
                      {cot.fecha_emision ? new Date(cot.fecha_emision).toLocaleDateString() : "-"}
                    </td>
                    <td data-label="Ejecutivo">{cot.ejecutivo}</td>
                    <td data-label="Total">{clp(calcularTotales(cot.items).total)} CLP</td>
                    <td data-label="Acciones">
                      <CotizacionAcciones cotizacion={cot} onVer={onVer} onEditar={onEditar} onEliminar={onEliminar} onPDF={onPDF} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cards-table">
            {cotizaciones.map((cot) => (
              <div key={cot.id} className="data-card">
                <div className="data-card-header">
                  <strong>Folio {cot.folio}</strong>
                </div>
                <div className="data-card-row">
                  <span className="label">Cliente</span>
                  <span className="value">{cot.cliente_razon_social}</span>
                </div>
                <div className="data-card-row">
                  <span className="label">Emisión</span>
                  <span className="value">
                    {cot.fecha_emision ? new Date(cot.fecha_emision).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="data-card-row">
                  <span className="label">Ejecutivo</span>
                  <span className="value">{cot.ejecutivo}</span>
                </div>
                <div className="data-card-row">
                  <span className="label">Total</span>
                  <span className="value">{clp(calcularTotales(cot.items).total)} CLP</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <CotizacionAcciones cotizacion={cot} onVer={onVer} onEditar={onEditar} onEliminar={onEliminar} onPDF={onPDF} />
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

export default CotizacionLista;
