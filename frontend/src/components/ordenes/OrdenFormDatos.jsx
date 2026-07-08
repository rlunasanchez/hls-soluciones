import { AlertCircle } from "lucide-react";

function OrdenFormDatos({ nuevaOrden, setNuevaOrden, errorNumeroOrden, verificarNumeroOrden }) {
  return (
    <div className="of-sec primary">
      <div className="of-st primary">Datos de la Orden</div>

      <div className="of-grid">
        <div className="of-f">
          <label>Número de Orden *</label>
          <input
            type="text"
            placeholder="Ej: OT-2024-001"
            value={nuevaOrden.numeroOrden}
            onChange={(e) => {
              setNuevaOrden({...nuevaOrden, numeroOrden: e.target.value});
              verificarNumeroOrden(e.target.value);
            }}
            required
          />
          {errorNumeroOrden && (
            <span style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={14} /> {errorNumeroOrden}
            </span>
          )}
        </div>

        <div className="of-f">
          <label>Fecha *</label>
          <input
            type="date"
            value={nuevaOrden.fecha}
            onChange={(e) => setNuevaOrden({...nuevaOrden, fecha: e.target.value})}
            required
          />
        </div>

        <div className="of-f" style={{justifyContent:'center'}}>
          <label className="of-chk">
            <input
              type="checkbox"
              checked={nuevaOrden.esGarantia}
              onChange={(e) => setNuevaOrden({...nuevaOrden, esGarantia: e.target.checked})}
            />
            Garantía
          </label>
        </div>
      </div>

      <div className="of-dates">
        <div className="of-date">
          <input type="checkbox" checked={nuevaOrden.fechaIngresoCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaIngresoCheck: e.target.checked})} />
          <span style={{fontSize:'.75rem',fontWeight:600}}>Ingreso</span>
          {nuevaOrden.fechaIngresoCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaIngreso} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaIngreso: e.target.value})} /></div>}
        </div>
        <div className="of-date">
          <input type="checkbox" checked={nuevaOrden.fechaTerminoCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaTerminoCheck: e.target.checked})} />
          <span style={{fontSize:'.75rem',fontWeight:600}}>Término</span>
          {nuevaOrden.fechaTerminoCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaTermino} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaTermino: e.target.value})} /></div>}
        </div>
        <div className="of-date">
          <input type="checkbox" checked={nuevaOrden.fechaEntregaCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaEntregaCheck: e.target.checked})} />
          <span style={{fontSize:'.75rem',fontWeight:600}}>Entrega</span>
          {nuevaOrden.fechaEntregaCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaEntrega} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaEntrega: e.target.value})} /></div>}
        </div>
        <div className="of-date">
          <input type="checkbox" checked={nuevaOrden.fechaCompraCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaCompraCheck: e.target.checked})} />
          <span style={{fontSize:'.75rem',fontWeight:600}}>Compra</span>
          {nuevaOrden.fechaCompraCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaCompra} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaCompra: e.target.value})} /></div>}
        </div>
      </div>
    </div>
  );
}

export default OrdenFormDatos;
