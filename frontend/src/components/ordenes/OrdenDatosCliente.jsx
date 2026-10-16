import { useState } from "react";
import { upperInput, validarRUT } from "../../utils/helpers";

// Datos propios del cliente en la OT (nombre, RUT, fono, email) y su tipo. bloqueados: campos que
// coinciden con la ficha del cliente seleccionado y solo se cambian con "Editar".
function OrdenDatosCliente({ nuevaOrden, setNuevaOrden, readOnly = false, esPersona = false, tieneCliente = false, bloqueados = {} }) {
  const [rutError, setRutError] = useState("");

  const handleRutChange = (e) => {
    let val = upperInput(e, /[^0-9K-]/g);
    if (val.length > 12) val = val.slice(0, 12);
    const partes = val.split("-");
    if (partes.length === 2) {
      if (partes[1].length > 1) partes[1] = partes[1][0];
      if (partes[0].length > 0) partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    } else if (partes.length === 1 && partes[0].length > 0) {
      partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    }
    val = partes.join("-");
    setNuevaOrden({ ...nuevaOrden, rut: val });
    if (rutError && val.length >= 9 && validarRUT(val)) setRutError("");
  };

  const handleRutBlur = (e) => {
    const val = e.target.value;
    if (!val) { setRutError(""); return; }
    const limpio = val.replace(/\./g, "").toUpperCase();
    const tieneGuion = limpio.includes("-");
    const match = limpio.match(/^(\d+)-([K0-9])$/);
    if (match) { if (validarRUT(val)) setRutError(""); else setRutError("RUT inválido"); return; }
    if (tieneGuion && !match) setRutError("RUT inválido");
    else if (!tieneGuion && limpio.length >= 5) setRutError("Falta el guion y dígito verificador");
    else setRutError("");
  };

  return (
  <div className="of-caja">
    <div className="of-caja-titulo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      Datos del cliente
      {/* Con un cliente elegido el tipo viene de su ficha; en una OT desde cero se elige acá. */}
      <select
        value={esPersona ? "PERSONA" : "EMPRESA"}
        disabled={readOnly || tieneCliente}
        style={{ padding: '0 6px', fontSize: '.75rem', height: '20px', border: '1.5px solid var(--border)', borderRadius: '6px', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400, color: 'var(--text-secondary, #475569)' }}
        onChange={(e) => {
          const tipo = e.target.value;
          setNuevaOrden((prev) => ({
            ...prev,
            clienteTipo: tipo,
            // Una persona no tiene contacto: se limpian sus campos
            ...(tipo === "PERSONA" ? { contacto: "", fonoContacto: "", emailContacto: "", cargoContacto: "" } : {})
          }));
        }}
      >
        <option value="EMPRESA">Empresa</option>
        <option value="PERSONA">Persona</option>
      </select>
    </div>
    <div className="of-form-grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: '15px' }}>
      <div className="of-f">
        <label>{esPersona ? "Nombre *" : "Cliente *"}</label>
        <input
          type="text"
          placeholder="Nombre del cliente"
          value={nuevaOrden.cliente}
          onChange={(e) => setNuevaOrden({...nuevaOrden, cliente: upperInput(e)})}
          disabled={readOnly || bloqueados.cliente}
          required
          style={{
            width: '100%',
            padding: '2px 8px',
            border: '1.5px solid var(--border)',
            borderRadius: '6px',
            fontSize: '.82rem'
          }}
        />
      </div>

      <div className="of-f" style={{ position: 'relative' }}>
        <label>RUT {rutError && <span style={{ position: 'absolute', right: 0, top: 0, whiteSpace: 'nowrap', color: '#dc2626', fontSize: '.7rem', textTransform: 'none', letterSpacing: 'normal' }}>{rutError}</span>}</label>
        <input
          type="text"
          placeholder="Ej: 12.345.678-9"
          value={nuevaOrden.rut}
          onChange={handleRutChange}
          onBlur={handleRutBlur}
          disabled={readOnly || bloqueados.rut}
          style={{
            width: '100%',
            border: rutError ? '1px solid #f87171' : undefined,
            background: rutError ? '#fef2f2' : undefined
          }}
        />
      </div>
    </div>

    <div className="of-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0 }}>
      <div className="of-f">
        <label>Fono Principal</label>
        <input
          type="tel"
          placeholder="Teléfono principal del cliente"
          value={nuevaOrden.fonoPrincipal}
          onChange={(e) => setNuevaOrden({...nuevaOrden, fonoPrincipal: e.target.value.replace(/[^0-9+]/g, '')})}
          disabled={readOnly || bloqueados.fono}
          style={{
            width: '100%',
            padding: '2px 8px',
            border: '1.5px solid var(--border)',
            borderRadius: '6px',
            fontSize: '.82rem'
          }}
        />
      </div>

      <div className="of-f">
        <label>Email</label>
        <input
          type="email"
          placeholder="Email del cliente"
          value={nuevaOrden.email}
          onChange={(e) => setNuevaOrden({...nuevaOrden, email: e.target.value})}
          disabled={readOnly || bloqueados.email}
          style={{
            width: '100%',
            padding: '2px 8px',
            border: '1.5px solid var(--border)',
            borderRadius: '6px',
            fontSize: '.82rem'
          }}
        />
      </div>
    </div>
  </div>
  );
}

export default OrdenDatosCliente;
