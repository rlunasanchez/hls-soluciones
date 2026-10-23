import { useState, useRef } from "react";
import api from "../services/api";
import { verificarCliente } from "../utils/clientesApi";
import { validarOrden, armarPayloadOrden } from "../utils/validarOrden";

// Guardar la orden abierta en el formulario (crear o actualizar) y las acciones que dependen de una
// orden ya guardada: generar su PDF e ir a crear una cotización.
//  - `editarOrden(orden)`: reabre la orden en el formulario (para "Guardar", que se queda).
//  - `alTerminar(eraOrdenNueva)`: qué hacer al guardar y salir (cerrar el formulario, volver al listado).
//  - `abrirPDF(orden)` y `irACotizacion(orden)`: reciben la orden fresca del servidor.
export default function useGuardarOrden({
  nuevaOrden, insumos, clienteSeleccionado, editingId, setEditingId, editarOrden, alTerminar, abrirPDF, irACotizacion
}) {
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);

  // PDF y Cotización de la orden abierta (ya guardada al menos una vez, con editingId): traen los
  // datos frescos de la orden para no trabajar con lo que quedó en el estado del formulario.
  const generarPDFOrdenActual = async () => {
    if (!editingId) return;
    abrirPDF((await api.get(`/api/ordenes/${editingId}`)).data);
  };

  const irACotizacionOrdenActual = async () => {
    if (!editingId) return;
    irACotizacion((await api.get(`/api/ordenes/${editingId}`)).data);
  };

  const guardarOrden = async (e, mantener = false) => {
    e.preventDefault();
    if (guardandoRef.current) return;

    let verificacion;
    try {
      verificacion = await verificarCliente({ rut: nuevaOrden.rut, razon_social: nuevaOrden.cliente });
    } catch {
      alert("No se pudo comprobar el cliente. Revise la conexión e intente de nuevo.");
      return;
    }
    const mensajeError = validarOrden(nuevaOrden, { verificacion, clienteSeleccionado });
    if (mensajeError) {
      alert(mensajeError);
      return;
    }

    const payload = armarPayloadOrden(nuevaOrden, insumos, clienteSeleccionado);

    const eraOrdenNueva = !editingId;
    guardandoRef.current = true;
    setGuardando(true);
    try {
      let idActual = editingId;
      if (editingId) {
        await api.put(`/api/ordenes/${editingId}`, payload);
      } else {
        const res = await api.post("/api/ordenes", payload);
        idActual = res.data.id;
        setEditingId(idActual);
      }

      if (mantener) {
        // "Guardar": guarda y se mantiene en la OT para seguir editando o generar el PDF
        const res = await api.get(`/api/ordenes/${idActual}`);
        await editarOrden(res.data);
      } else {
        alert(eraOrdenNueva ? "Orden guardada exitosamente" : "Orden actualizada exitosamente");
        alTerminar(eraOrdenNueva);
      }
    } catch (err) {
      console.error("Error al guardar orden:", err);
      alert("Error al guardar la orden");
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  return { guardando, guardarOrden, generarPDFOrdenActual, irACotizacionOrdenActual };
}
