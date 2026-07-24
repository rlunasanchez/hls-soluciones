import { useState, useEffect } from "react";
import { X, Trash2, UserPlus } from "lucide-react";

const crearContactoVacio = () => ({ nombre: "", email: "", fono: "", cargo: "", direccion: "" });

function ModalContactos({ contactos = [], onChange, onClose, readOnly = false }) {
  const [lista, setLista] = useState([]);

  useEffect(() => {
    if (contactos && contactos.length > 0) {
      const cargados = contactos.filter(c => c.nombre && c.nombre.trim());
      setLista(cargados.length > 0 ? [...cargados] : [crearContactoVacio()]);
    } else {
      setLista([crearContactoVacio()]);
    }
  }, [contactos]);

  const agregar = () => setLista([...lista, crearContactoVacio()]);

  const eliminar = (idx) => {
    if (!window.confirm(`¿Eliminar contacto ${idx + 1}?`)) return;
    const nueva = lista.filter((_, i) => i !== idx);
    setLista(nueva.length > 0 ? nueva : [crearContactoVacio()]);
  };

  const actualizar = (idx, campo, valor) => {
    setLista(lista.map((c, i) => i === idx ? { ...c, [campo]: valor } : c));
  };

  const guardar = () => {
    const filtrados = lista.filter(c => c.nombre && c.nombre.trim());
    onChange(filtrados.length > 0 ? filtrados : []);
    onClose();
  };

  const total = lista.filter(c => c.nombre && c.nombre.trim()).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contactos" onClick={e => e.stopPropagation()}>
        <div className="modal-contactos-head">
          <h3>
            <UserPlus size={18} />
            Contactos Adicionales {total > 0 && <span className="modal-contactos-badge">{total}</span>}
          </h3>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-contactos-body">
          {lista.map((contacto, idx) => (
            <div key={idx} className="modal-contacto-card">
              <div className="modal-contacto-header">
                <span className="modal-contacto-num">Contacto {idx + 1}</span>
                {!readOnly && lista.length > 1 && (
                  <button type="button" className="cf-btn-d" onClick={() => eliminar(idx)}>
                    <Trash2 size={13} /> Eliminar
                  </button>
                )}
              </div>
              <div className="modal-contacto-campos">
                <div className="cf-field">
                  <label>Nombre *</label>
                  <input placeholder="Nombre del contacto" value={contacto.nombre}
                    disabled={readOnly}
                    onChange={e => actualizar(idx, "nombre", e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ""))} />
                </div>
                <div className="cf-r2">
                  <div className="cf-field">
                    <label>Email</label>
                    <input type="email" placeholder="Email" value={contacto.email}
                      disabled={readOnly}
                      onChange={e => actualizar(idx, "email", e.target.value)} />
                  </div>
                  <div className="cf-field">
                    <label>Fono</label>
                    <input placeholder="Fono" value={contacto.fono}
                      disabled={readOnly}
                      onChange={e => actualizar(idx, "fono", e.target.value.replace(/[^0-9+]/g, ""))} />
                  </div>
                </div>
                <div className="cf-r2">
                  <div className="cf-field">
                    <label>Cargo</label>
                    <input placeholder="Cargo" value={contacto.cargo}
                      disabled={readOnly}
                      onChange={e => actualizar(idx, "cargo", e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ""))} />
                  </div>
                  <div className="cf-field">
                    <label>Dirección</label>
                    <input placeholder="Dirección" value={contacto.direccion}
                      disabled={readOnly}
                      onChange={e => actualizar(idx, "direccion", e.target.value.toUpperCase())} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-contactos-foot">
          {!readOnly && (
            <button type="button" className="cf-btn-a" onClick={agregar}>
              + Agregar Contacto
            </button>
          )}
          <div className="modal-contactos-foot-actions">
            <button type="button" className="cf-btn-c" onClick={onClose}>
              {readOnly ? "Cerrar" : "Cancelar"}
            </button>
            {!readOnly && (
              <button type="button" className="cf-btn-p" onClick={guardar}>
                Guardar Contactos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalContactos;
