import { Save, X } from "lucide-react";
import OrdenFormAcciones from "./OrdenFormAcciones";

// Botones al pie del formulario de la OT. "Guardar Cambios" guarda y se queda; el botón principal
// (submit) guarda y sale; Cancelar/Cerrar solo cierra. Con la orden ya guardada suma PDF y Cotización.
function OrdenFormBotones({ soloLectura, editingId, guardando, onCerrar, onGuardarCambios, onPDF, onCotizacion }) {
  return (
    <div className="of-sub">
      <button type="button" className="of-btn-c" onClick={onCerrar}>
        <X size={16} /> {soloLectura ? "Cerrar" : "Cancelar"}
      </button>
      {!soloLectura && (
        <button type="button" className="of-btn-s" onClick={onGuardarCambios} disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : (editingId ? "Guardar Cambios" : "Guardar")}
        </button>
      )}
      {!soloLectura && (
        <button type="submit" className="of-btn-p" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : (editingId ? "Cerrar" : "Guardar Orden")}
        </button>
      )}
      {editingId && <OrdenFormAcciones onPDF={onPDF} onCotizacion={onCotizacion} />}
    </div>
  );
}

export default OrdenFormBotones;
