import { FileSpreadsheet } from "lucide-react";
import BarraFiltros from "../comunes/BarraFiltros";
import CotizacionAcciones from "./CotizacionAcciones";

const clp = (n) => Math.round(Number(n) || 0).toLocaleString("es-CL");

function CotizacionLista({ cotizaciones, loading, filtroFolio, onFiltroFolioChange, filtroCliente, onFiltroClienteChange, onLimpiar, onNueva, paginaActual, totalPaginas, onPageChange, onVer, onEditar, onEliminar, onPDF }) {
  return (
    <>
      <BarraFiltros
        acciones={[{ texto: "Nueva Cotización", onClick: onNueva }]}
        campos={[
          { valor: filtroFolio, onChange: onFiltroFolioChange, placeholder: "Folio" },
          { valor: filtroCliente, onChange: onFiltroClienteChange, placeholder: "Cliente" }
        ]}
        onLimpiar={onLimpiar} paginaActual={paginaActual} totalPaginas={totalPaginas} onPageChange={onPageChange}
      />

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
                  <th className="col-ot-dot" title="Tiene una OT asociada">Con OT</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((cot) => (
                  <tr key={cot.id}>
                    <td data-label="Folio"><span className="codigo-badge">{cot.folio}</span></td>
                    <td data-label="Cliente">{cot.cliente}</td>
                    <td data-label="Emisión">
                      {cot.fecha_emision ? new Date(cot.fecha_emision).toLocaleDateString() : "-"}
                    </td>
                    <td data-label="Ejecutivo">{cot.ejecutivo}</td>
                    <td data-label="Total">{clp(cot.total)} CLP</td>
                    <td className="col-ot-dot" data-label="OT">
                      {cot.orden_id && (
                        <span
                          className="ot-dot"
                          title={`Asociada a OT ${cot.orden_numero || `#${cot.orden_id}`}`}
                        />
                      )}
                    </td>
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <strong>Folio {cot.folio}</strong>
                    {cot.orden_id && (
                      <span
                        className="ot-dot"
                        title={`Asociada a OT ${cot.orden_numero || `#${cot.orden_id}`}`}
                      />
                    )}
                  </span>
                </div>
                <div className="data-card-row">
                  <span className="label">Cliente</span>
                  <span className="value">{cot.cliente}</span>
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
                  <span className="value">{clp(cot.total)} CLP</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <CotizacionAcciones cotizacion={cot} onVer={onVer} onEditar={onEditar} onEliminar={onEliminar} onPDF={onPDF} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default CotizacionLista;
