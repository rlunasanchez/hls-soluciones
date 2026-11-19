import { useEffect } from "react";
import { clienteDeOrden, clientePorId } from "../utils/clientesApi";
import { formularioDesdeOrden, formularioDesdeCliente } from "../utils/cotizacionFormato";

// Abre el formulario de Cotizaciones con lo que llega por navigate('/cotizaciones', { state }):
// - { cotizacionId, cotizacionSoloLectura, volverOrdenId, volverOrdenSoloLectura }: una cotización puntual
//   desde el chip "Cotizaciones Asociadas" de una OT (Ver → solo lectura, Editar → editable).
// - { orden }: cotización nueva desde el menú de una OT; queda asociada a ella (orden_id).
// - { cliente }: cotización nueva desde Clientes; sin OT asociada.
// `form` es lo que devuelve useCotizacionFormulario.
export default function useCotizacionDesdeNavegacion(location, form) {
  useEffect(() => {
    const { cotizacionId, cotizacionSoloLectura, volverOrdenId, volverOrdenSoloLectura, orden, cliente: clienteNav } = location.state || {};
    if (!cotizacionId && !orden && !clienteNav) return;
    window.history.replaceState({}, document.title);

    (async () => {
      if (cotizacionId) {
        await form.cargarCotizacion({ id: cotizacionId }, !!cotizacionSoloLectura);
        // cargarCotizacion deja origenOT en false; acá sí venimos de la OT, para que Cancelar vuelva a ella.
        form.setOrigenOT(true);
        if (volverOrdenId) form.setOrdenOrigen({ id: volverOrdenId, soloLectura: !!volverOrdenSoloLectura });
        return;
      }
      await form.cargarPerfil();
      if (orden) {
        const { cliente } = await clienteDeOrden(orden);
        form.abrirConDatos({ datos: formularioDesdeOrden(form.nuevaCotizacion(), orden, cliente), cliente, desdeOT: true });
      } else {
        let cliente = clienteNav;
        try { cliente = (await clientePorId(clienteNav.id)) || clienteNav; } catch { /* usa los datos que trae la navegación */ }
        form.abrirConDatos({ datos: formularioDesdeCliente(form.nuevaCotizacion(), cliente), cliente });
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
