import { useState, useEffect, useRef } from "react";
import { Contact, Save, X } from "lucide-react";
import { toUpper, upperInput, validarEmail } from "../../utils/helpers";

function ContactoFormulario({ contactoEditando, onCancel, onSave, contactos, readOnly = false }) {
  const [nuevoContacto, setNuevoContacto] = useState({
    codigo: "", nombre: "", email: "", fono: "", cargo: ""
  });
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);

  const codigoActual = (() => {
    let max = 0;
    (contactos || []).forEach(c => {
      if (c.codigo && c.codigo.startsWith("CO-")) {
        const num = parseInt(c.codigo.split("-")[1], 10);
        if (num > max) max = num;
      }
    });
    return `CO-${String(max + 1).padStart(4, "0")}`;
  })();

  useEffect(() => {
    if (contactoEditando) {
      setNuevoContacto({
        codigo: contactoEditando.codigo || "",
        nombre: toUpper(contactoEditando.nombre),
        email: contactoEditando.email || "",
        fono: contactoEditando.fono || "",
        cargo: toUpper(contactoEditando.cargo)
      });
    }
  }, [contactoEditando]);

  const handleSubmit = (e, mantener = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (guardandoRef.current) return;
    if (nuevoContacto.nombre.trim().length < 3) {
      alert("Ingrese el nombre completo del contacto (mínimo 3 caracteres).");
      return;
    }
    if (nuevoContacto.email.trim() && !validarEmail(nuevoContacto.email)) {
      alert("Email inválido.");
      return;
    }
    guardandoRef.current = true;
    setGuardando(true);
    Promise.resolve(onSave({ ...nuevoContacto }, contactoEditando?.id, mantener)).finally(() => {
      guardandoRef.current = false;
      setGuardando(false);
    });
  };

  return (
    <div style={{ maxWidth: '740px', margin: '0 auto', padding: '20px' }}>
      <div className="cof-wrap">
        <div className="cof-head">
          <h2><Contact size={22} />{readOnly ? "Ver Contacto" : contactoEditando ? "Editar Contacto" : "Nuevo Contacto"}</h2>
          <button type="button" className="cof-head-close" onClick={onCancel}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="cof-form">
          <div className="cof-s primary">
            <div className="cof-st primary">Datos del Contacto</div>
            <div className="cof-r2" style={{ marginBottom: '8px' }}>
              <div className="cof-f cof-code">
                <label>Código</label>
                <input value={contactoEditando ? (contactoEditando.codigo || codigoActual) : codigoActual} disabled />
              </div>
            </div>
            <div className="cof-r2" style={{ marginTop: '8px' }}>
              <div className="cof-f">
                <label>Nombre *</label>
                <input placeholder="Nombre del contacto" value={nuevoContacto.nombre}
                  disabled={readOnly}
                  onChange={e => setNuevoContacto({ ...nuevoContacto, nombre: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })} required />
              </div>
              <div className="cof-f">
                <label>Cargo</label>
                <input placeholder="Cargo" value={nuevoContacto.cargo}
                  disabled={readOnly}
                  onChange={e => setNuevoContacto({ ...nuevoContacto, cargo: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })} />
              </div>
            </div>
            <div className="cof-r2" style={{ marginTop: '8px' }}>
              <div className="cof-f">
                <label>Email</label>
                <input type="email" placeholder="Email" value={nuevoContacto.email}
                  disabled={readOnly}
                  onChange={e => setNuevoContacto({ ...nuevoContacto, email: e.target.value })} />
              </div>
              <div className="cof-f">
                <label>Fono</label>
                <input placeholder="Fono" value={nuevoContacto.fono}
                  disabled={readOnly}
                  onChange={e => setNuevoContacto({ ...nuevoContacto, fono: e.target.value.replace(/[^0-9+]/g, '') })} />
              </div>
            </div>
          </div>
          <div className="cof-sub">
            {readOnly ? (
              <button type="button" className="cof-btn-c" onClick={onCancel}><X size={18} /> Cerrar</button>
            ) : (
              <>
                <button type="button" className="cof-btn-c" onClick={onCancel}><X size={18} /> Cancelar</button>
                {contactoEditando && (
                  <button type="button" className="cof-btn-s" onClick={(e) => handleSubmit(e, true)} disabled={guardando}><Save size={18} /> {guardando ? "Guardando..." : "Guardar Cambios"}</button>
                )}
                <button type="submit" className="cof-btn-p" disabled={guardando}><Save size={18} /> {guardando ? "Guardando..." : (contactoEditando ? "Cerrar" : "Guardar Contacto")}</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ContactoFormulario;
