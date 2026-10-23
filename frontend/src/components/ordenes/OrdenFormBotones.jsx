import { Save, X } from "lucide-react";
import OrdenFormAcciones from "./OrdenFormAcciones";

// Botones al pie del formulario de la OT. "Guardar" guarda y se queda; "Guardar y salir" (submit)
// guarda y sale; Cancelar/Cerrar solo cierra sin guardar. Con la orden ya guardada suma PDF y Cotización.
function OrdenFormBotones({ soloLectura, editingId, guardando, onCerrar, onGuardarCambios, onPDF, onCotizacion }) {
  return (
    <div className="of-sub">
      <button type="button" className="of-btn-c" onClick={onCerrar}>
        <X size={16} /> {soloLectura ? "Cerrar" : "Cancelar"}
      </button>
      {!soloLectura && (
        <button type="button" className="of-btn-s" onClick={onGuardarCambios} disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      )}
      {!soloLectura && (
        <button type="submit" className="of-btn-p" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar y salir"}
        </button>
      )}
      {editingId && <OrdenFormAcciones onPDF={onPDF} onCotizacion={onCotizacion} />}
    </div>
  );
}

export default OrdenFormBotones;
