const CONDICIONES = [
  "Contado - CLP", "Crédito 30 días", "Crédito 60 días", "Transferencia Bancaria",
  "Contra entrega", "Transferencia previa", "Orden de compra 30 días"
];

// Los campos de fecha y las listas salen 2 px más altos que los de texto (25 px contra 23,06 px). Con este alto
// quedan iguales a los de Cliente, Contacto y Dirección; el largo no cambia.
const ALTO_IGUAL = { height: "23.06px" };

// Sección "Ejecutivo y Condiciones" de la cotización: ejecutivo, fechas, condición de pago y glosa.
// Misma caja y mismo título que "Datos del cliente / contacto / dirección" (of-caja + of-caja-titulo).
function CotizacionFormEjecutivo({ cotizacion, setCotizacion, soloLectura }) {
  const cambiar = (campo, valor) => setCotizacion((prev) => ({ ...prev, [campo]: valor }));
  return (
    <div className="of-sec primary" style={{ marginTop: 8 }}>
      <div className="of-caja" style={{ marginBottom: 0 }}>
        <div className="of-caja-titulo">Ejecutivo y Condiciones</div>
        {/* Dos líneas de tres campos: ejecutivo, fono y email; emisión, válido hasta y condición */}
        <div className="of-r3">
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
        <div className="of-r3">
          <div className="of-f">
            <label>Emisión</label>
            <input type="date" value={cotizacion.fechaEmision} onChange={(e) => cambiar("fechaEmision", e.target.value)} disabled={soloLectura} required style={ALTO_IGUAL} />
          </div>
          <div className="of-f">
            <label>Válido hasta</label>
            <input type="date" value={cotizacion.fechaValidoHasta} onChange={(e) => cambiar("fechaValidoHasta", e.target.value)} disabled={soloLectura} style={ALTO_IGUAL} />
          </div>
          <div className="of-f">
            <label>Condición</label>
            <select value={cotizacion.condicion} onChange={(e) => cambiar("condicion", e.target.value)} disabled={soloLectura} style={ALTO_IGUAL}>
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
    </div>
  );
}

export default CotizacionFormEjecutivo;
