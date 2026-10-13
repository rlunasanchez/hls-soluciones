import { Save, X } from "lucide-react";
import "../../styles/botones.css";

// Pie común de las fichas (Cliente, Contacto, Dirección): Cancelar / Guardar Cambios / Guardar o Cerrar.
//  clase: prefijo de estilos de la ficha ("cf", "cof", "dif").
//  textoSeguir: texto del botón que guarda y sigue en la ficha (null = no se muestra).
//  onGuardar: si se omite, el botón principal es el submit del formulario.
function AccionesFicha({ clase, readOnly, guardando, onCancelar, textoSeguir = null, onSeguir, textoGuardar, onGuardar }) {
  return (
    <div className={`${clase}-sub`}>
      <button type="button" className={`${clase}-btn-c`} onClick={onCancelar}>
        <X size={18} /> {readOnly ? "Cerrar" : "Cancelar"}
      </button>
      {!readOnly && textoSeguir && (
        <button type="button" className={`${clase}-btn-s`} onClick={onSeguir} disabled={guardando}>
          <Save size={18} /> {guardando ? "Guardando..." : textoSeguir}
        </button>
      )}
      {!readOnly && (
        <button type={onGuardar ? "button" : "submit"} className={`${clase}-btn-p`} onClick={onGuardar} disabled={guardando}>
          <Save size={18} /> {guardando ? "Guardando..." : textoGuardar}
        </button>
      )}
    </div>
  );
}

export default AccionesFicha;
