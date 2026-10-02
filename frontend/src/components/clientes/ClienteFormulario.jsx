import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toUpper, validarRUT, upperInput, normalizarRut, validarEmail } from "../../utils/helpers";
import api from "../../services/api";
import VinculosCliente from "./VinculosCliente";
import useGuardar from "../../hooks/useGuardar";
import AccionesFicha from "../comunes/AccionesFicha";

// Contactos y Direcciones viven en sus propios mantenedores (catálogos
// globales). Acá solo se buscan y se vinculan al cliente (muchos a muchos);
// la OT/Cotización/Informe/Orden de Compra los llaman desde esta relación.
const ESTADO_INICIAL_CLIENTE = {
  razon_social: "", giro: "", rut: "", direccion: "", ciudad: "",
  comuna: "", telefono: "", email: ""
};

// soloCliente: ficha con únicamente los datos del cliente (razón social, RUT, fono, email),
// sin las tablas de contactos y direcciones; no toca sus vínculos ni sus checks.
function ClienteFormulario({ clienteEditando, clientes = [], onSave, onCancel, titulo, readOnly = false, modoRegistro = false, soloCliente = false }) {
  const [nuevoCliente, setNuevoCliente] = useState(ESTADO_INICIAL_CLIENTE);
  const [rutError, setRutError] = useState("");
  const [guardando, guardar] = useGuardar();
  const [contactos, setContactos] = useState([]);
  const [direcciones, setDirecciones] = useState([]);
  // Solo se envían los vínculos si se cargaron bien: un fallo de carga no debe
  // vaciar los vínculos ya guardados al guardar el cliente.
  const [vinculosListos, setVinculosListos] = useState(false);

  useEffect(() => {
    setContactos([]);
    setDirecciones([]);
    if (!clienteEditando?.id) { setVinculosListos(true); return; }
    setVinculosListos(false);
    const controller = new AbortController();
    Promise.all([
      api.get(`/api/clientes/${clienteEditando.id}/contactos`, { signal: controller.signal }),
      api.get(`/api/clientes/${clienteEditando.id}/direcciones`, { signal: controller.signal }),
    ]).then(([c, d]) => {
      setContactos(c.data);
      setDirecciones(d.data);
      setVinculosListos(true);
    }).catch((err) => {
      if (err.name !== "CanceledError") console.error("Error al cargar vínculos:", err);
    });
    return () => controller.abort();
  }, [clienteEditando?.id]);

  useEffect(() => {
    if (clienteEditando) {
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
        email: clienteEditando.email || ""
      });
    }
  }, [clienteEditando]);

  const resetFormulario = () => {
    setNuevoCliente(ESTADO_INICIAL_CLIENTE);
    setRutError("");
    setContactos([]);
    setDirecciones([]);
  };

  const handleSubmit = (e, mantener = false) => {
    e.preventDefault();
    if (guardando) return;
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
    const vinculos = (vinculosListos && !soloCliente)
      ? {
          contacto_ids: contactos.map((c) => c.id), direccion_ids: direcciones.map((d) => d.id),
          // Marcado "En la OT" (uno por tabla; null = ninguno)
          contacto_a_ot_id: contactos.find((c) => c.a_ot)?.id ?? null,
          direccion_a_ot_id: direcciones.find((d) => d.a_ot)?.id ?? null
        }
      : {};
    guardar(() => onSave({ ...nuevoCliente, ...vinculos }, resetFormulario, mantener));
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
    <div className={soloCliente ? "cf-wrap" : "cf-wrap cf-wrap-ancho"}>
      <div className="cf-card">
        <div className="cf-head">
          <h2>{titulo || (readOnly ? "Ver Cliente" : clienteEditando ? "Editar Cliente" : "Nuevo Cliente")}</h2>
          <button type="button" onClick={() => { resetFormulario(); onCancel(); }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="cf" noValidate>
          <div className={soloCliente ? "cf-grid" : "cf-grid cf-grid-3"}>
            <div className="cf-sec cf-sec-empresa">
              <h3>Empresa o Persona</h3>
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
              <div className="cf-r1" style={{ display: "none" }}>
                <div className="cf-field">
                  <label>Giro</label>
                  <input placeholder="Giro" value={nuevoCliente.giro}
                    disabled={readOnly}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, giro: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "") })} />
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
              {/* Dirección, ciudad y comuna propias de la empresa o persona. No se usan en la OT:
                  allí el contacto y la dirección se eligen de los mantenedores. */}
              <div className="cf-r1 cf-mt">
                <div className="cf-field">
                  <label>Dirección</label>
                  <input placeholder="Ingrese la dirección completa" value={nuevoCliente.direccion}
                    disabled={readOnly}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: upperInput(e) })} />
                </div>
              </div>
              <div className="cf-r2">
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
            </div>
            {!soloCliente && <VinculosCliente tipo="contactos" vinculados={contactos} onChange={setContactos} readOnly={readOnly} />}
            {!soloCliente && <VinculosCliente tipo="direcciones" vinculados={direcciones} onChange={setDirecciones} readOnly={readOnly} />}
          </div>

          <AccionesFicha clase="cf" readOnly={readOnly} guardando={guardando}
            onCancelar={() => { resetFormulario(); onCancel(); }}
            textoSeguir={modoRegistro ? null : (clienteEditando ? "Guardar Cambios" : "Guardar")} onSeguir={(e) => handleSubmit(e, true)}
            textoGuardar={(clienteEditando && !modoRegistro) ? "Cerrar" : "Guardar Cliente"} onGuardar={(e) => handleSubmit(e, false)} />
        </form>
      </div>
    </div>
  );
}

export default ClienteFormulario;
