import { upperInput } from "../../utils/helpers";

const soloLetras = (e) => upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "");
const estiloInput = { width: "100%", padding: "2px 8px", border: "1.5px solid var(--border)", borderRadius: "6px", fontSize: ".82rem" };

// Datos del contacto de la OT (copia del contacto elegido). deshabilitado: solo lectura, persona
// (no tiene contacto) o contacto traído del buscador (se cambia con "Editar").
function OrdenDatosContacto({ nuevaOrden, setNuevaOrden, deshabilitado = false }) {
  const campos = [
    { campo: "contacto", etiqueta: "Contacto", tipo: "text", placeholder: "Nombre del contacto", limpiar: soloLetras },
    { campo: "fonoContacto", etiqueta: "Fono Contacto", tipo: "tel", placeholder: "Teléfono del contacto", limpiar: (e) => e.target.value.replace(/[^0-9+]/g, "") },
    { campo: "emailContacto", etiqueta: "Email Contacto", tipo: "email", placeholder: "Email del contacto", limpiar: (e) => e.target.value },
    { campo: "cargoContacto", etiqueta: "Cargo Contacto", tipo: "text", placeholder: "Cargo del contacto", limpiar: soloLetras },
  ];
  return (
    <div className="of-caja">
      <div className="of-caja-titulo">Datos del contacto</div>
      <div className="of-form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {campos.map(({ campo, etiqueta, tipo, placeholder, limpiar }) => (
          <div className="of-f" key={campo}>
            <label>{etiqueta}</label>
            <input type={tipo} placeholder={placeholder} value={nuevaOrden[campo]} disabled={deshabilitado} style={estiloInput}
              onChange={(e) => setNuevaOrden({ ...nuevaOrden, [campo]: limpiar(e) })} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrdenDatosContacto;
