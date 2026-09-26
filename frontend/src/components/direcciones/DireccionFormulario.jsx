import { useState, useEffect, useRef } from "react";
import { MapPin, Save, X } from "lucide-react";
import { toUpper, upperInput } from "../../utils/helpers";

function DireccionFormulario({ direccionEditando, onCancel, onSave, direcciones, readOnly = false }) {
  const [nuevaDireccion, setNuevaDireccion] = useState({
    codigo: "", direccion: "", ciudad: "", comuna: ""
  });
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);

  const codigoActual = (() => {
    let max = 0;
    (direcciones || []).forEach(d => {
      if (d.codigo && d.codigo.startsWith("DI-")) {
        const num = parseInt(d.codigo.split("-")[1], 10);
        if (num > max) max = num;
      }
    });
    return `DI-${String(max + 1).padStart(4, "0")}`;
  })();

  useEffect(() => {
    if (direccionEditando) {
      setNuevaDireccion({
        codigo: direccionEditando.codigo || "",
        direccion: toUpper(direccionEditando.direccion),
        ciudad: toUpper(direccionEditando.ciudad),
        comuna: toUpper(direccionEditando.comuna)
      });
    }
  }, [direccionEditando]);

  const handleSubmit = (e, mantener = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (guardandoRef.current) return;
    if (nuevaDireccion.direccion.trim().length < 5) {
      alert("Ingrese la dirección completa (mínimo 5 caracteres).");
      return;
    }
    guardandoRef.current = true;
    setGuardando(true);
    Promise.resolve(onSave({ ...nuevaDireccion }, direccionEditando?.id, mantener)).finally(() => {
      guardandoRef.current = false;
      setGuardando(false);
    });
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '12px' }}>
      <div className="dif-wrap">
        <div className="dif-head">
          <h2><MapPin size={22} />{readOnly ? "Ver Dirección" : direccionEditando ? "Editar Dirección" : "Nueva Dirección"}</h2>
          <button type="button" className="dif-head-close" onClick={onCancel}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="dif-form">
          <div className="dif-s primary">
            <div className="dif-st primary">Datos de la Dirección</div>
            <div className="dif-r2" style={{ marginBottom: '8px' }}>
              <div className="dif-f dif-code">
                <label>Código</label>
                <input value={direccionEditando ? (direccionEditando.codigo || codigoActual) : codigoActual} disabled />
              </div>
            </div>
            <div className="dif-f" style={{ marginTop: '8px' }}>
              <label>Dirección *</label>
              <input placeholder="Dirección" value={nuevaDireccion.direccion}
                disabled={readOnly}
                onChange={e => setNuevaDireccion({ ...nuevaDireccion, direccion: upperInput(e) })} required />
            </div>
            <div className="dif-r2" style={{ marginTop: '8px' }}>
              <div className="dif-f">
                <label>Ciudad</label>
                <input placeholder="Ciudad" value={nuevaDireccion.ciudad}
                  disabled={readOnly}
                  onChange={e => setNuevaDireccion({ ...nuevaDireccion, ciudad: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })} />
              </div>
              <div className="dif-f">
                <label>Comuna</label>
                <input placeholder="Comuna" value={nuevaDireccion.comuna}
                  disabled={readOnly}
                  onChange={e => setNuevaDireccion({ ...nuevaDireccion, comuna: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })} />
              </div>
            </div>
          </div>
          <div className="dif-sub">
            {readOnly ? (
              <button type="button" className="dif-btn-c" onClick={onCancel}><X size={18} /> Cerrar</button>
            ) : (
              <>
                <button type="button" className="dif-btn-c" onClick={onCancel}><X size={18} /> Cancelar</button>
                {direccionEditando && (
                  <button type="button" className="dif-btn-s" onClick={(e) => handleSubmit(e, true)} disabled={guardando}><Save size={18} /> {guardando ? "Guardando..." : "Guardar Cambios"}</button>
                )}
                <button type="submit" className="dif-btn-p" disabled={guardando}><Save size={18} /> {guardando ? "Guardando..." : (direccionEditando ? "Cerrar" : "Guardar Dirección")}</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default DireccionFormulario;
