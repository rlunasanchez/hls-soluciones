import { Wrench, X } from "lucide-react";
import { capitalizarNombre } from "../../utils/helpers";

// Encabezado azul del formulario de la OT: título según el modo, técnico, cantidad de cotizaciones y cerrar.
function OrdenFormCabecera({ soloLectura, editingId, tecnico, cantidadCotizaciones, onCerrar }) {
  const insignia = { fontWeight: 600, fontSize: "0.75rem", color: "#fff", background: "rgba(255,255,255,0.22)", padding: "2px 8px", borderRadius: 999 };
  return (
    <div className="of-head">
      <h2><Wrench size={20} /> {soloLectura ? "Ver Orden" : editingId ? "Editar Orden" : "Nueva Orden"}</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {tecnico && <span style={insignia}>Técnico: {capitalizarNombre(tecnico)}</span>}
        {cantidadCotizaciones > 0 && <span style={insignia}>Cotizaciones: {cantidadCotizaciones}</span>}
        <button type="button" className="of-head-close" onClick={onCerrar}><X size={18} /></button>
      </div>
    </div>
  );
}

export default OrdenFormCabecera;
