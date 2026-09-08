import { useState, useEffect } from "react";
import { X, Trash2, UserPlus, ChevronUp, ChevronDown } from "lucide-react";
import { upperInput, validarEmail } from "../../utils/helpers";

const crearContactoVacio = () => ({ nombre: "", email: "", fono: "", cargo: "", direccion: "" });

function ModalContactos({ contactos = [], onChange, onClose, readOnly = false }) {
  const [lista, setLista] = useState([]);
  // Mismo patrón que Sucursales/Direcciones: resumen colapsado por defecto,
  // cada chip se abre/cierra individualmente (varias pueden estar abiertas
  // a la vez), "+ Agregar" solo despliega la fila nueva.
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const [manualVisibles, setManualVisibles] = useState(() => new Set());

  useEffect(() => {
    if (contactos && contactos.length > 0) {
      const cargados = contactos.filter(c => c.nombre && c.nombre.trim());
      if (cargados.length > 0) {
        setLista([...cargados]);
        setResumenAbierto(false);
        setManualVisibles(new Set());
      } else {
        setLista([crearContactoVacio()]);
        setManualVisibles(new Set([0]));
      }
    } else {
      setLista([crearContactoVacio()]);
      setManualVisibles(new Set([0]));
    }
  }, [contactos]);

  const agregar = () => {
    const nuevoIdx = lista.length;
    setLista([...lista, crearContactoVacio()]);
    // Solo la recién agregada queda abierta, para no estirar la ventana.
    setManualVisibles(new Set([nuevoIdx]));
  };

  const eliminar = (idx) => {
    if (!window.confirm(`¿Eliminar contacto ${idx + 1}?`)) return;
    const nueva = lista.filter((_, i) => i !== idx);
    if (nueva.length === 0) {
      setLista([crearContactoVacio()]);
      setManualVisibles(new Set([0]));
      setResumenAbierto(false);
      return;
    }
    setLista(nueva);
    setManualVisibles(prev => {
      const next = new Set();
      prev.forEach(i => {
        if (i < idx) next.add(i);
        else if (i > idx) next.add(i - 1);
      });
      return next;
    });
  };

  const actualizar = (idx, campo, valor) => {
    setLista(lista.map((c, i) => i === idx ? { ...c, [campo]: valor } : c));
  };

  const guardar = () => {
    for (const c of lista) {
      if (c.nombre && c.nombre.trim() && String(c.email || "").trim() && !validarEmail(c.email)) {
        alert(`Email inválido (${c.nombre}).`);
        return;
      }
    }
    const filtrados = lista.filter(c => c.nombre && c.nombre.trim());
    onChange(filtrados.length > 0 ? filtrados : []);
    onClose();
  };

  const total = lista.filter(c => c.nombre && c.nombre.trim()).length;
  const hayOcultos = lista.some((_, i) => !manualVisibles.has(i));

  return (
    <div className="modal-overlay">
      <div className="modal-contactos" onClick={e => e.stopPropagation()}>
        <div className="modal-contactos-head">
          <h3>
            <UserPlus size={18} />
            Contactos Adicionales {total > 0 && <span className="modal-contactos-badge">{total}</span>}
          </h3>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-contactos-body">
          {lista.length > 0 && (resumenAbierto || hayOcultos) && (
            <button
              type="button"
              className="contacto-chip-toggle"
              onClick={() => {
                const abrir = !resumenAbierto;
                setResumenAbierto(abrir);
                if (!abrir) setManualVisibles(new Set());
              }}
              style={{
                alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 4,
                background: "#dcfce7", color: "#166534", border: "1px solid #86efac"
              }}
            >
              {resumenAbierto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {resumenAbierto ? "Ver menos" : `${lista.length} contacto${lista.length > 1 ? "s" : ""} — Ver`}
            </button>
          )}

          {lista.length > 0 && resumenAbierto && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
              {lista.map((c, idx) => (
                <span key={idx} className="contacto-chip" style={{ cursor: "default" }}>
                  <span
                    onClick={() => setManualVisibles(prev => {
                      const next = new Set(prev);
                      if (next.has(idx)) next.delete(idx); else next.add(idx);
                      return next;
                    })}
                    style={{ cursor: "pointer" }}
                  >
                    {c.nombre ? c.nombre : `Contacto ${idx + 1}`}
                  </span>
                  {!readOnly && lista.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminar(idx)}
                      title="Quitar contacto"
                      style={{ background: "none", border: "none", color: "#166534", cursor: "pointer", display: "flex", padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {lista.map((contacto, idx) => {
            if (!manualVisibles.has(idx)) return null;
            return (
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
                    onChange={e => actualizar(idx, "nombre", upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ""))} />
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
                      onChange={e => actualizar(idx, "cargo", upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ""))} />
                  </div>
                  <div className="cf-field">
                    <label>Dirección</label>
                    <input placeholder="Dirección" value={contacto.direccion}
                      disabled={readOnly}
                      onChange={e => actualizar(idx, "direccion", upperInput(e))} />
                  </div>
                </div>
              </div>
            </div>
            );
          })}
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
