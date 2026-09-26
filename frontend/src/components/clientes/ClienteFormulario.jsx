import { useState, useEffect, useRef } from "react";
import { Save, X } from "lucide-react";
import { toUpper, validarRUT, upperInput, normalizarRut, validarEmail } from "../../utils/helpers";

// Los contactos ya no se gestionan acá — viven en su propio mantenedor
// (Contactos, independiente de Cliente) y se "llaman" desde la OT/Cotización
// buscándolos, no editándolos desde la ficha del cliente. Las sucursales
// tampoco: viven en el mantenedor de Direcciones.
const ESTADO_INICIAL_CLIENTE = {
  razon_social: "", rut: "", direccion: "", ciudad: "",
  comuna: "", telefono: "", email: ""
};

function ClienteFormulario({ clienteEditando, clientes = [], onSave, onCancel, titulo, readOnly = false, modoRegistro = false }) {
  const [nuevoCliente, setNuevoCliente] = useState(ESTADO_INICIAL_CLIENTE);
  const [rutError, setRutError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);

  useEffect(() => {
    if (clienteEditando) {
      setRutError("");
      setNuevoCliente({
        codigo: clienteEditando.codigo || "",
        razon_social: toUpper(clienteEditando.razon_social),
        rut: clienteEditando.rut || "",
        direccion: toUpper(clienteEditando.direccion),
        ciudad: toUpper(clienteEditando.ciudad),
        comuna: toUpper(clienteEditando.comuna),
        telefono: clienteEditando.telefono || "",
        email: clienteEditando.email || ""
      });
    }
  }, [clienteEditando]);

  const calcularSiguienteCodigo = () => {
    let max = 0;
    clientes.forEach((c) => {
      if (c.codigo && c.codigo.startsWith("CL-")) {
        const num = parseInt(c.codigo.split("-")[1], 10);
        if (num > max) max = num;
      }
    });
    return `CL-${String(max + 1).padStart(4, "0")}`;
  };

  const resetFormulario = () => {
    setNuevoCliente(ESTADO_INICIAL_CLIENTE);
    setRutError("");
  };

  const handleSubmit = (e, mantener = false) => {
    e.preventDefault();
    if (guardandoRef.current) return;
    if (!nuevoCliente.razon_social || !nuevoCliente.razon_social.trim()) {
      alert("Ingrese la Razón Social.");
      return;
    }
    if (!nuevoCliente.rut || !nuevoCliente.rut.trim()) {
      alert("Ingrese el RUT.");
      return;
    }
    // RUT "19" = comodín para clientes sin RUT conocido: se puede repetir sin validación
    const rutNormalizado = normalizarRut(nuevoCliente.rut);
    if (rutNormalizado !== "19") {
      if (!validarRUT(nuevoCliente.rut)) {
        alert("RUT inválido.");
        return;
      }
      const clienteConRut = (clientes || []).find((c) => {
        if (clienteEditando && c.id === clienteEditando.id) return false;
        return normalizarRut(c.rut) === rutNormalizado;
      });
      if (clienteConRut) {
        alert(`El RUT ya existe (${clienteConRut.codigo || "CL-????"}).`);
        return;
      }
    }
    if (String(nuevoCliente.email || "").trim() && !validarEmail(nuevoCliente.email)) {
      alert("Email inválido.");
      return;
    }
    guardandoRef.current = true;
    setGuardando(true);
    Promise.resolve(onSave({ ...nuevoCliente }, resetFormulario, mantener)).finally(() => {
      guardandoRef.current = false;
      setGuardando(false);
    });
  };

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
    setNuevoCliente({ ...nuevoCliente, rut: val });
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
    <div className="cf-wrap">
      <div className="cf-card">
        <div className="cf-head">
          <h2>{titulo || (readOnly ? "Ver Cliente" : clienteEditando ? "Editar Cliente" : "Nuevo Cliente")}</h2>
          <button type="button" onClick={() => { resetFormulario(); onCancel(); }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="cf" noValidate>
          <div className="cf-grid">
            <div className="cf-sec cf-sec-empresa">
              <h3>Datos del Cliente</h3>
              <div className="cf-codigo" style={{ marginBottom: 6 }}>
                <div className="cf-field">
                  <label>Código</label>
                  <input
                    value={clienteEditando ? (clienteEditando.codigo || calcularSiguienteCodigo()) : calcularSiguienteCodigo()}
                    disabled
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "200px", gap: 6 }}>
                <div className="cf-field" style={{ position: "relative" }}>
                  <label>RUT {rutError && <span style={{ position: "absolute", right: 0, top: 0, whiteSpace: "nowrap", color: "#dc2626", fontSize: ".7rem" }}>{rutError}</span>}</label>
                  <input placeholder="Ej: 12.345.678-9" value={nuevoCliente.rut}
                    disabled={readOnly}
                    style={rutError ? { border: "1px solid #f87171", background: "#fef2f2" } : {}}
                    onChange={handleRutChange} onBlur={handleRutBlur} />
                </div>
              </div>
              <div className="cf-r1 cf-mt">
                <div className="cf-field">
                  <label>Razón Social *</label>
                  <input placeholder="Razón social" value={nuevoCliente.razon_social}
                    disabled={readOnly}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: upperInput(e) })} required />
                </div>
              </div>
              {/* Dirección/Ciudad/Comuna del cliente ya no se ingresan acá: se
                  buscan y se llaman desde la OT/Cotización (mantenedor de
                  Direcciones, independiente de Cliente). Se dejan ocultos
                  (no se borran) para no perder los valores ya guardados de
                  clientes existentes al editar otros campos. */}
              <div className="cf-r1" style={{ display: "none" }}>
                <div className="cf-field">
                  <label>Dirección</label>
                  <input placeholder="Ingrese la dirección completa" value={nuevoCliente.direccion}
                    disabled={readOnly}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: upperInput(e) })} />
                </div>
              </div>
              <div className="cf-r3" style={{ display: "none" }}>
                <div className="cf-field">
                  <label>Ciudad</label>
                  <input placeholder="Ciudad" value={nuevoCliente.ciudad}
                    disabled={readOnly}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, ciudad: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "") })} />
                </div>
                <div className="cf-field">
                  <label>Comuna</label>
                  <input placeholder="Comuna" value={nuevoCliente.comuna}
                    disabled={readOnly}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, comuna: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "") })} />
                </div>
              </div>
              <div className="cf-r2 cf-mt">
                <div className="cf-field">
                  <label>Fono</label>
                  <input placeholder="Fono" value={nuevoCliente.telefono}
                    disabled={readOnly}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value.replace(/[^0-9+]/g, "") })} />
                </div>
                <div className="cf-field">
                  <label>Email</label>
                  <input type="email" placeholder="Email" value={nuevoCliente.email}
                    disabled={readOnly}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <div className="cf-sub">
            {readOnly ? (
              <button type="button" className="cf-btn-c" onClick={() => { resetFormulario(); onCancel(); }}><X size={18} /> Cerrar</button>
            ) : (
              <>
                <button type="button" className="cf-btn-c" onClick={() => { resetFormulario(); onCancel(); }}><X size={18} /> Cancelar</button>
                {!modoRegistro && (
                  <button type="button" className="cf-btn-s" onClick={(e) => handleSubmit(e, true)} disabled={guardando}><Save size={18} /> {guardando ? "Guardando..." : (clienteEditando ? "Guardar Cambios" : "Guardar")}</button>
                )}
                <button type="button" className="cf-btn-p" onClick={(e) => handleSubmit(e, false)} disabled={guardando}><Save size={18} /> {guardando ? "Guardando..." : ((clienteEditando && !modoRegistro) ? "Cerrar" : "Guardar Cliente")}</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClienteFormulario;
