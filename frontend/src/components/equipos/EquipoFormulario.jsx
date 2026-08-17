import { useState, useEffect } from "react";
import { Package, Save, X } from "lucide-react";
import { toUpper } from "../../utils/helpers";

function EquipoFormulario({ equipoEditando, onCancel, onSave, equipos, readOnly = false }) {
  const [nuevoEquipo, setNuevoEquipo] = useState({
    codigo: "", equipo: "", modelo: "", marca: "", serie: ""
  });

  const codigoActual = (() => {
    let max = 0;
    (equipos || []).forEach(eq => {
      if (eq.codigo && eq.codigo.startsWith("EQ-")) {
        const num = parseInt(eq.codigo.split("-")[1], 10);
        if (num > max) max = num;
      }
    });
    return `EQ-${String(max + 1).padStart(4, "0")}`;
  })();

  useEffect(() => {
    if (equipoEditando) {
      setNuevoEquipo({
        codigo: equipoEditando.codigo || "",
        equipo: toUpper(equipoEditando.equipo),
        modelo: toUpper(equipoEditando.modelo),
        marca: toUpper(equipoEditando.marca),
        serie: toUpper(equipoEditando.serie)
      });
    }
  }, [equipoEditando]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...nuevoEquipo }, equipoEditando?.id);
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '740px', margin: '0 auto', padding: '20px' }}>
        <div className="ef-wrap">
          <div className="ef-head">
            <h2><Package size={22} />{readOnly ? "Ver Equipo" : equipoEditando ? "Editar Equipo" : "Nuevo Equipo"}</h2>
            <button type="button" className="ef-head-close" onClick={onCancel}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="ef-form">
            <div className="ef-s primary">
              <div className="ef-st primary">Información del Equipo</div>
              <div className="ef-r2" style={{ marginBottom: '8px' }}>
                <div className="ef-f ef-code">
                  <label>Código</label>
                  <input value={equipoEditando ? (equipoEditando.codigo || codigoActual) : codigoActual} disabled />
                </div>
              </div>
              <div className="ef-r2">
                <div className="ef-f">
                  <label>Equipo *</label>
                  <input placeholder="Nombre del equipo" value={nuevoEquipo.equipo}
                    disabled={readOnly}
                    onChange={e => setNuevoEquipo({...nuevoEquipo, equipo: upperInput(e)})} required />
                </div>
                <div className="ef-f">
                  <label>Marca *</label>
                  <input placeholder="Marca" value={nuevoEquipo.marca}
                    disabled={readOnly}
                    onChange={e => setNuevoEquipo({...nuevoEquipo, marca: upperInput(e)})} required />
                </div>
              </div>
              <div className="ef-r2" style={{ marginTop: '8px' }}>
                <div className="ef-f">
                  <label>Modelo *</label>
                  <input placeholder="Modelo" value={nuevoEquipo.modelo}
                    disabled={readOnly}
                    onChange={e => setNuevoEquipo({...nuevoEquipo, modelo: upperInput(e)})} required />
                </div>
                <div className="ef-f">
                  <label>Serie</label>
                  <input placeholder="Número de serie" value={nuevoEquipo.serie}
                    disabled={readOnly}
                    onChange={e => setNuevoEquipo({...nuevoEquipo, serie: upperInput(e)})} />
                </div>
              </div>
            </div>
            <div className="ef-sub">
              {readOnly ? (
                <button type="button" className="ef-btn-c" onClick={onCancel}><X size={18} /> Cerrar</button>
              ) : (
                <>
                  <button type="button" className="ef-btn-c" onClick={onCancel}><X size={18} /> Cancelar</button>
                  <button type="submit" className="ef-btn-p"><Save size={18} /> {equipoEditando ? "Guardar Cambios" : "Guardar Equipo"}</button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EquipoFormulario;
