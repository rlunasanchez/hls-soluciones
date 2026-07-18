import { useState, useEffect } from "react";
import { Save, X, Trash2 } from "lucide-react";
import { toUpper, validarRUT } from "../../utils/helpers";

const SUCURSAL_VACIA = { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" };

const ESTADO_INICIAL_CLIENTE = {
  razon_social: "", giro: "", rut: "", direccion: "", ciudad: "",
  comuna: "", telefono: "", email: "", contacto_nombre: "", contacto_email: "",
  contacto_fono: "", contacto_cargo: "", contacto_direccion: ""
};

function ClienteFormulario({ clienteEditando, clientes = [], onSave, onCancel, titulo }) {
  const [nuevoCliente, setNuevoCliente] = useState(ESTADO_INICIAL_CLIENTE);
  const [sucursales, setSucursales] = useState([
    SUCURSAL_VACIA, SUCURSAL_VACIA, SUCURSAL_VACIA, SUCURSAL_VACIA, SUCURSAL_VACIA
  ]);
  const [sucursalesVisibles, setSucursalesVisibles] = useState(1);
  const [rutError, setRutError] = useState("");

  useEffect(() => {
    if (clienteEditando) {
      setSucursales([
        SUCURSAL_VACIA, SUCURSAL_VACIA, SUCURSAL_VACIA, SUCURSAL_VACIA, SUCURSAL_VACIA
      ]);
      let dirs = [];
      if (clienteEditando.direcciones) {
        dirs = clienteEditando.direcciones.split(";;").map((d) => {
          const parts = d.split("|");
          return {
            tipo_direccion: parts[0] || "", direccion: toUpper(parts[1] || ""),
            fono: parts[2] || "", ciudad: toUpper(parts[3] || ""), comuna: toUpper(parts[4] || "")
          };
        }).filter((d) => d.direccion);
        if (dirs.length > 0) {
          while (dirs.length < 5) dirs.push(SUCURSAL_VACIA);
          setSucursales(dirs);
        }
      }
      setSucursalesVisibles(dirs.filter((s) => s.direccion).length || 1);
      setRutError("");
      setNuevoCliente({
        codigo: clienteEditando.codigo || "",
        razon_social: toUpper(clienteEditando.razon_social),
        giro: toUpper(clienteEditando.giro),
        rut: clienteEditando.rut || "",
        direccion: toUpper(clienteEditando.direccion),
        ciudad: toUpper(clienteEditando.ciudad),
        comuna: toUpper(clienteEditando.comuna),
        telefono: clienteEditando.telefono || "",
        email: clienteEditando.email || "",
        contacto_nombre: toUpper(clienteEditando.contacto_nombre),
        contacto_email: clienteEditando.contacto_email || "",
        contacto_fono: clienteEditando.contacto_fono || "",
        contacto_cargo: toUpper(clienteEditando.contacto_cargo),
        contacto_direccion: toUpper(clienteEditando.contacto_direccion),
        direcciones: dirs
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

  const actualizarSucursal = (idx, campo, valor) => {
    const nuevas = sucursales.map((s, i) => i === idx ? { ...s, [campo]: valor } : s);
    setSucursales(nuevas);
  };

  const resetFormulario = () => {
    setNuevoCliente(ESTADO_INICIAL_CLIENTE);
    setSucursales([
      SUCURSAL_VACIA, SUCURSAL_VACIA, SUCURSAL_VACIA, SUCURSAL_VACIA, SUCURSAL_VACIA
    ]);
    setSucursalesVisibles(1);
    setRutError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nuevoCliente.rut && !validarRUT(nuevoCliente.rut)) {
      alert("RUT inválido. Ejemplo: 12.345.678-9");
      return;
    }
    const dirs = sucursales.filter((s) => s.direccion.trim() !== "");
    onSave({ ...nuevoCliente, direcciones: dirs }, resetFormulario);
  };

  const handleRutChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/[^0-9K-]/g, "");
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
          <h2>{titulo || (clienteEditando ? "Editar Cliente" : "Nuevo Cliente")}</h2>
          <button type="button" onClick={() => { resetFormulario(); onCancel(); }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="cf">
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
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 6 }}>
                <div className="cf-field">
                  <label>Razón Social *</label>
                  <input placeholder="Razón social" value={nuevoCliente.razon_social}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value.toUpperCase() })} required />
                </div>
                <div className="cf-field">
                  <label>Giro</label>
                  <input placeholder="Giro" value={nuevoCliente.giro}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, giro: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "") })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "200px", gap: 6, marginTop: 6 }}>
                <div className="cf-field">
                  <label>RUT {rutError && <span style={{ color: "#dc2626", fontSize: ".72rem" }}> — {rutError}</span>}</label>
                  <input placeholder="Ej: 12.345.678-9" value={nuevoCliente.rut}
                    style={rutError ? { border: "2px solid #dc2626", background: "#fef2f2" } : {}}
                    onChange={handleRutChange} onBlur={handleRutBlur} />
                </div>
              </div>
              <div className="cf-r1 cf-mt">
                <div className="cf-field">
                  <label>Dirección</label>
                  <input placeholder="Ingrese la dirección completa" value={nuevoCliente.direccion}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value.toUpperCase() })} />
                </div>
              </div>
              <div className="cf-r3 cf-mt">
                <div className="cf-field">
                  <label>Ciudad</label>
                  <input placeholder="Ciudad" value={nuevoCliente.ciudad}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "") })} />
                </div>
                <div className="cf-field">
                  <label>Comuna</label>
                  <input placeholder="Comuna" value={nuevoCliente.comuna}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, comuna: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "") })} />
                </div>
                <div className="cf-field">
                  <label>Fono</label>
                  <input placeholder="Fono" value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value.replace(/[^0-9+]/g, "") })} />
                </div>
              </div>
              <div className="cf-r1 cf-mt">
                <div className="cf-field">
                  <label>Email</label>
                  <input type="email" placeholder="Email" value={nuevoCliente.email}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="cf-sec cf-sec-contacto">
              <h3>Datos del Contacto</h3>
              <div className="cf-r1 cf-mt">
                <div className="cf-field">
                  <label>Nombre Contacto</label>
                  <input placeholder="Nombre" value={nuevoCliente.contacto_nombre}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_nombre: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "") })} />
                </div>
              </div>
              <div className="cf-r2 cf-mt">
                <div className="cf-field">
                  <label>Email</label>
                  <input type="email" placeholder="Email" value={nuevoCliente.contacto_email}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_email: e.target.value })} />
                </div>
                <div className="cf-field">
                  <label>Fono</label>
                  <input placeholder="Fono" value={nuevoCliente.contacto_fono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_fono: e.target.value.replace(/[^0-9+]/g, "") })} />
                </div>
              </div>
              <div className="cf-r1 cf-mt">
                <div className="cf-field">
                  <label>Cargo</label>
                  <input placeholder="Cargo" value={nuevoCliente.contacto_cargo}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_cargo: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "") })} />
                </div>
              </div>
              <div className="cf-r1 cf-mt">
                <div className="cf-field">
                  <label>Dirección Contacto</label>
                  <input placeholder="Ingrese la dirección completa" value={nuevoCliente.contacto_direccion}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_direccion: e.target.value.toUpperCase() })} />
                </div>
              </div>
            </div>
          </div>

          <div className="cf-sec cf-sec-suc">
            <div className="cf-sh">
              <h3>Sucursales/Direcciones</h3>
              {sucursalesVisibles < 5 && (
                <button type="button" className="cf-btn-a" onClick={() => setSucursalesVisibles(sucursalesVisibles + 1)}>+ Agregar</button>
              )}
            </div>
            {sucursales.slice(0, sucursalesVisibles).map((suc, idx) => (
              <div key={idx} className="cf-sc">
                <div className="cf-r2 cf-mb">
                  <div className="cf-field cf-m0">
                    <label>Tipo</label>
                    <select value={suc.tipo_direccion} onChange={(e) => actualizarSucursal(idx, "tipo_direccion", e.target.value)}>
                      <option value="">Seleccionar</option>
                      <option value="Matriz">Matriz</option>
                      <option value="Sucursal">Sucursal</option>
                    </select>
                  </div>
                  <div className="cf-field cf-m0">
                    <label>Dirección</label>
                    <input placeholder="Ingrese la dirección completa" value={suc.direccion} onChange={(e) => actualizarSucursal(idx, "direccion", e.target.value.toUpperCase())} />
                  </div>
                </div>
                <div className="cf-r3 cf-mb">
                  <div className="cf-field cf-m0">
                    <label>Ciudad</label>
                    <input placeholder="Ciudad" value={suc.ciudad} onChange={(e) => actualizarSucursal(idx, "ciudad", e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ""))} />
                  </div>
                  <div className="cf-field cf-m0">
                    <label>Fono</label>
                    <input placeholder="Fono" value={suc.fono} onChange={(e) => actualizarSucursal(idx, "fono", e.target.value.replace(/[^0-9+]/g, ""))} />
                  </div>
                  <div className="cf-field cf-m0">
                    <label>Comuna</label>
                    <input placeholder="Comuna" value={suc.comuna} onChange={(e) => actualizarSucursal(idx, "comuna", e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ""))} />
                  </div>
                </div>
                <div className="cf-sc-del">
                  <button type="button" className="cf-btn-d" onClick={() => {
                    if (!window.confirm(`¿Eliminar sucursal ${idx + 1}?`)) return;
                    const nuevas = sucursales.filter((_, i) => i !== idx);
                    while (nuevas.length < 5) nuevas.push(SUCURSAL_VACIA);
                    setSucursales(nuevas);
                    setSucursalesVisibles(Math.max(1, sucursalesVisibles - 1));
                  }}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cf-sub">
            <button type="button" className="cf-btn-c" onClick={() => { resetFormulario(); onCancel(); }}><X size={18} /> Cancelar</button>
            <button type="button" className="cf-btn-p" onClick={handleSubmit}><Save size={18} /> {clienteEditando ? "Guardar Cambios" : "Guardar Cliente"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClienteFormulario;
