import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { toUpper, upperInput } from "../../utils/helpers";
import useGuardar from "../../hooks/useGuardar";
import AccionesFicha from "../comunes/AccionesFicha";

function DireccionFormulario({ direccionEditando, onCancel, onSave, readOnly = false }) {
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
      <div className="ef-wrap">
        <div className="ef-head">
          <h2><MapPin size={22} />{readOnly ? "Ver Dirección" : direccionEditando ? "Editar Dirección" : "Nueva Dirección"}</h2>
          <button type="button" className="ef-head-close" onClick={onCancel}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="ef-form">
          <div className="ef-s primary">
            <div className="ef-st primary">Datos de la Dirección</div>
            <div className="ef-r2" style={{ marginTop: '8px' }}>
              <div className="ef-f of-col-full">
                <label>Dirección *</label>
                <input value={nuevaDireccion.direccion}
                  disabled={readOnly}
                  onChange={e => setNuevaDireccion({ ...nuevaDireccion, direccion: upperInput(e) })} required />
              </div>
              <div className="ef-f">
                <label>Ciudad</label>
                <input value={nuevaDireccion.ciudad}
                  disabled={readOnly}
                  onChange={e => setNuevaDireccion({ ...nuevaDireccion, ciudad: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })} />
              </div>
              <div className="ef-f">
                <label>Comuna</label>
                <input value={nuevaDireccion.comuna}
                  disabled={readOnly}
                  onChange={e => setNuevaDireccion({ ...nuevaDireccion, comuna: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })} />
              </div>
            </div>
          </div>
          <AccionesFicha clase="ef" readOnly={readOnly} guardando={guardando} onCancelar={onCancel}
            textoSeguir={direccionEditando ? "Guardar" : null} onSeguir={(e) => handleSubmit(e, true)}
            textoGuardar="Guardar y salir" />
        </form>
      </div>
    </div>
  );
}

export default DireccionFormulario;
