import { upperInput } from "../../utils/helpers";

// Observaciones adicionales de la OT.
function OrdenFormObservaciones({ nuevaOrden, setNuevaOrden, readOnly }) {
  return (
    <div className="of-sec muted">
      <div className="of-st primary">Observaciones</div>
      <div className="of-f">
        <textarea
          placeholder="Observaciones adicionales..."
          value={nuevaOrden.observaciones}
          onChange={(e) => setNuevaOrden({ ...nuevaOrden, observaciones: upperInput(e) })}
          rows={4}
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

export default OrdenFormObservaciones;
