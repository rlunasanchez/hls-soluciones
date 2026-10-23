import { useEffect } from "react";

// Al entrar a Orden de Trabajo, abre lo que viene desde otra pantalla (state de la navegación):
// - `orden`: una orden para editar (desde Clientes o Cotizaciones).
// - `verOrdenId`: volver a la OT desde la que se abrió una cotización asociada (chip "Cotizaciones
//   Asociadas" → Cancelar/Cerrar en la Cotización), en el mismo modo en que estaba: Ver o Editar.
// - `cliente`: una OT nueva con los datos de ese cliente (botón "OT" de Clientes).
// Sin nada de eso, la página arranca en el listado.
export default function useOrdenDesdeNavegacion({ setMostrarFormulario, setEditingId, editarOrden, verOrden, abrirNuevaOrden }) {
  useEffect(() => {
    const init = async () => {
      const navState = window.history.state?.usr;

      // Limpiar siempre al inicio
      setMostrarFormulario(false);
      setEditingId(null);

      // Solo procesar si hay datos de cliente, orden, o una orden puntual a reabrir
      if (!navState || (!navState.cliente && !navState.orden && !navState.verOrdenId)) return;

      const { orden, cliente, verOrdenId, verOrdenSoloLectura } = navState;

      if (orden) {
        editarOrden(orden);
        window.history.replaceState({}, document.title);
      }

      if (verOrdenId) {
        if (verOrdenSoloLectura) verOrden({ id: verOrdenId });
        else editarOrden({ id: verOrdenId });
        window.history.replaceState({}, document.title);
      }

      if (cliente) await abrirNuevaOrden(cliente);
    };
    init();
  }, []);
}
