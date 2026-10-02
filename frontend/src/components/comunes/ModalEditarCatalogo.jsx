import { useState } from "react";
import { createPortal } from "react-dom";
import api from "../../services/api";
import ContactoFormulario from "../contactos/ContactoFormulario";
import DireccionFormulario from "../direcciones/DireccionFormulario";
import "../../styles/Contactos.css";
import "../../styles/Direcciones.css";
import "../../styles/campo-catalogo.css";

const FICHAS = {
  contactos: { Formulario: ContactoFormulario, propFicha: "contactoEditando", propLista: "contactos", verbo: "contacto" },
  direcciones: { Formulario: DireccionFormulario, propFicha: "direccionEditando", propLista: "direcciones", verbo: "dirección" },
};

// Ventana para editar un contacto o una dirección en su ficha del mantenedor (la misma de
// Contactos / Direcciones). Al guardar actualiza el registro en el catálogo y avisa con
// onGuardado(registroActualizado); "Guardar Cambios" la deja abierta, "Cerrar" la cierra.
function ModalEditarCatalogo({ tipo, registro, onGuardado, onCerrar }) {
  const cfg = FICHAS[tipo];
  const [actual, setActual] = useState(registro);
  const Formulario = cfg.Formulario;

  const guardar = async (payload, id, mantener = false) => {
    try {
      await api.put(`/api/${tipo}/${id}`, payload);
      const actualizado = (await api.get(`/api/${tipo}/${id}`)).data;
      onGuardado(actualizado);
      if (mantener) setActual(actualizado); else onCerrar();
    } catch (err) { alert(err.response?.data?.msg || `Error al guardar el ${cfg.verbo}.`); }
  };

  return createPortal(
    <div className="bc-modal">
      <div className="bc-modal-caja">
        <Formulario {...{ [cfg.propFicha]: actual, [cfg.propLista]: [], onSave: guardar, onCancel: onCerrar }} />
      </div>
    </div>,
    document.body
  );
}

export default ModalEditarCatalogo;
