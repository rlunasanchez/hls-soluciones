const CONDICIONES = [
  "Contado - CLP", "Crédito 30 días", "Crédito 60 días", "Transferencia Bancaria",
  "Contra entrega", "Transferencia previa", "Orden de compra 30 días"
];

// Sección "Ejecutivo y Condiciones" de la cotización: ejecutivo, fechas, condición de pago y glosa.
function CotizacionFormEjecutivo({ cotizacion, setCotizacion, soloLectura }) {
  const cambiar = (campo, valor) => setCotizacion((prev) => ({ ...prev, [campo]: valor }));
  return (
    <div className="of-sec success" style={{ marginTop: 8 }}>
      <div className="of-st primary">Ejecutivo y Condiciones</div>
      <div className="of-form-grid" style={{ marginBottom: 0 }}>
        <div className="of-f">
          <label>Ejecutivo</label>
          <input type="text" value={cotizacion.ejecutivo} disabled />
        </div>
        <div className="of-f">
          <label>Fono Ejecutivo</label>
          <input type="tel" value={cotizacion.ejecutivoFono} onChange={(e) => cambiar("ejecutivoFono", e.target.value.replace(/[^0-9+]/g, ""))} disabled={soloLectura} />
        </div>
        <div className="of-f">
          <label>Email Ejecutivo</label>
          <input type="email" value={cotizacion.ejecutivoEmail} onChange={(e) => cambiar("ejecutivoEmail", e.target.value)} disabled={soloLectura} />
        </div>
      </div>
      <div className="of-form-grid" style={{ marginTop: 10 }}>
        <div className="of-f">
          <label>Emisión</label>
          <input type="date" value={cotizacion.fechaEmision} onChange={(e) => cambiar("fechaEmision", e.target.value)} disabled={soloLectura} required />
        </div>
        <div className="of-f">
          <label>Válido hasta</label>
          <input type="date" value={cotizacion.fechaValidoHasta} onChange={(e) => cambiar("fechaValidoHasta", e.target.value)} disabled={soloLectura} />
        </div>
        <div className="of-f">
          <label>Condición</label>
          <select value={cotizacion.condicion} onChange={(e) => cambiar("condicion", e.target.value)} disabled={soloLectura}>
            {CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="of-f" style={{ marginTop: 10 }}>
        <label>Glosa</label>
        <textarea
          value={cotizacion.glosa}
          onChange={(e) => cambiar("glosa", e.target.value)}
          rows={3}
          disabled={soloLectura}
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
      </div>
    </div>
  );
}

export default CotizacionFormEjecutivo;
