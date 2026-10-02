import { useState, useEffect } from "react";
import { Contact, X } from "lucide-react";
import { toUpper, upperInput, validarEmail } from "../../utils/helpers";
import useGuardar from "../../hooks/useGuardar";
import AccionesFicha from "../comunes/AccionesFicha";

function ContactoFormulario({ contactoEditando, onCancel, onSave, contactos, readOnly = false }) {
  const [nuevoContacto, setNuevoContacto] = useState({
    codigo: "", nombre: "", email: "", fono: "", cargo: ""
  });
  const [guardando, guardar] = useGuardar();

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
    if (guardando) return;
    if (nuevoContacto.nombre.trim().length < 3) {
      alert("Ingrese el nombre completo del contacto (mínimo 3 caracteres).");
      return;
    }
    if (nuevoContacto.email.trim() && !validarEmail(nuevoContacto.email)) {
      alert("Email inválido.");
      return;
    }
    guardar(() => onSave({ ...nuevoContacto }, contactoEditando?.id, mantener));
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
          <AccionesFicha clase="cof" readOnly={readOnly} guardando={guardando} onCancelar={onCancel}
            textoSeguir={contactoEditando ? "Guardar Cambios" : null} onSeguir={(e) => handleSubmit(e, true)}
            textoGuardar={contactoEditando ? "Cerrar" : "Guardar Contacto"} />
        </form>
      </div>
    </div>
  );
}

export default ContactoFormulario;
