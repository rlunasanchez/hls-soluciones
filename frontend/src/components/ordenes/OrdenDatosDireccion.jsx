import { upperInput } from "../../utils/helpers";

const soloLetras = (e) => upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "");

// Datos de la dirección de la OT (copia de la dirección elegida). deshabilitado: solo lectura o
// dirección traída del buscador (se cambia con "Editar").
function OrdenDatosDireccion({ nuevaOrden, setNuevaOrden, deshabilitado = false }) {
  const campos = [
    { campo: "direccion", etiqueta: "Dirección", placeholder: "Dirección del cliente", limpiar: (e) => upperInput(e) },
    { campo: "ciudad", etiqueta: "Ciudad", placeholder: "Ciudad", limpiar: soloLetras },
    { campo: "comuna", etiqueta: "Comuna", placeholder: "Comuna", limpiar: soloLetras },
  ];
  return (
    <div className="of-caja">
      <div className="of-caja-titulo">Datos de la dirección</div>
      <div className="of-form-grid" style={{ gridTemplateColumns: "1.4fr 1fr 1fr", marginBottom: 0 }}>
        {campos.map(({ campo, etiqueta, placeholder, limpiar }) => (
          <div className="of-f" key={campo}>
            <label>{etiqueta}</label>
            <input type="text" placeholder={placeholder} value={nuevaOrden[campo]} disabled={deshabilitado} style={{ width: "100%" }}
              onChange={(e) => setNuevaOrden({ ...nuevaOrden, [campo]: limpiar(e) })} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrdenDatosDireccion;
