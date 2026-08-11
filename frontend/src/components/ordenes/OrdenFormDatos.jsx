function OrdenFormDatos({ nuevaOrden, setNuevaOrden, readOnly }) {
  return (
    <div className="of-sec primary">
      <div className="of-head-row">
        <div className="of-st primary">Datos de la Orden</div>

        <div className="of-grid">
          <div className="of-f of-f-inline of-f-num">
            <label>N° Orden *</label>
            <input
              type="text"
              value={nuevaOrden.numeroOrden}
              disabled
              title="El número de orden se asigna automáticamente"
            />
          </div>

          <div className="of-f of-f-inline">
            <label>Fecha *</label>
            <input
              type="date"
              value={nuevaOrden.fecha}
              onChange={(e) => setNuevaOrden({...nuevaOrden, fecha: e.target.value})}
              disabled={readOnly}
              required
            />
          </div>
        </div>
      </div>

      <div className="of-dates">
        <div className="of-date">
          <input type="checkbox" checked={nuevaOrden.fechaIngresoCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaIngresoCheck: e.target.checked})} disabled={readOnly} />
          <span>Ingreso</span>
          {nuevaOrden.fechaIngresoCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaIngreso} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaIngreso: e.target.value})} disabled={readOnly} /></div>}
        </div>
        <div className="of-date">
          <input type="checkbox" checked={nuevaOrden.fechaTerminoCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaTerminoCheck: e.target.checked})} disabled={readOnly} />
          <span>Término</span>
          {nuevaOrden.fechaTerminoCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaTermino} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaTermino: e.target.value})} disabled={readOnly} /></div>}
        </div>
        <div className="of-date">
          <input type="checkbox" checked={nuevaOrden.fechaEntregaCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaEntregaCheck: e.target.checked})} disabled={readOnly} />
          <span>Entrega</span>
          {nuevaOrden.fechaEntregaCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaEntrega} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaEntrega: e.target.value})} disabled={readOnly} /></div>}
        </div>
        <div className="of-date">
          <input type="checkbox" checked={nuevaOrden.fechaCompraCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaCompraCheck: e.target.checked})} disabled={readOnly} />
          <span>Compra</span>
          {nuevaOrden.fechaCompraCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaCompra} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaCompra: e.target.value})} disabled={readOnly} /></div>}
        </div>
        <div className="of-date">
          <input type="checkbox" checked={nuevaOrden.esGarantia} onChange={(e) => setNuevaOrden({...nuevaOrden, esGarantia: e.target.checked})} disabled={readOnly} />
          <span>Garantía</span>
        </div>
      </div>
    </div>
  );
}

export default OrdenFormDatos;
