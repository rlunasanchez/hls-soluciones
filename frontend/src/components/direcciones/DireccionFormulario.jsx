import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { toUpper, upperInput } from "../../utils/helpers";
import useGuardar from "../../hooks/useGuardar";
import AccionesFicha from "../comunes/AccionesFicha";

function DireccionFormulario({ direccionEditando, onCancel, onSave, direcciones, readOnly = false }) {
  const [nuevaDireccion, setNuevaDireccion] = useState({
    codigo: "", direccion: "", ciudad: "", comuna: ""
  });
  const [guardando, guardar] = useGuardar();

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
    if (guardando) return;
    if (nuevaDireccion.direccion.trim().length < 5) {
      alert("Ingrese la dirección completa (mínimo 5 caracteres).");
      return;
    }
    guardar(() => onSave({ ...nuevaDireccion }, direccionEditando?.id, mantener));
  };

  return (
    <div style={{ maxWidth: '740px', margin: '0 auto', padding: '20px' }}>
      <div className="dif-wrap">
        <div className="dif-head">
          <h2><MapPin size={22} />{readOnly ? "Ver Dirección" : direccionEditando ? "Editar Dirección" : "Nueva Dirección"}</h2>
          <button type="button" className="dif-head-close" onClick={onCancel}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="dif-form">
          <div className="dif-s primary">
            <div className="dif-st primary">Datos de la Dirección</div>
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
          <AccionesFicha clase="dif" readOnly={readOnly} guardando={guardando} onCancelar={onCancel}
            textoSeguir={direccionEditando ? "Guardar Cambios" : null} onSeguir={(e) => handleSubmit(e, true)}
            textoGuardar={direccionEditando ? "Cerrar" : "Guardar Dirección"} />
        </form>
      </div>
    </div>
  );
}

export default DireccionFormulario;
