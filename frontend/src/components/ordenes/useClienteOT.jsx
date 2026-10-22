import { useState } from "react";
import { createPortal } from "react-dom";
import { Pencil } from "lucide-react";
import ClienteFormulario from "../clientes/ClienteFormulario";
import { toUpper, normalizarRut } from "../../utils/helpers";
import api from "../../services/api";
import { verificarCliente, clientePorId } from "../../utils/clientesApi";

// Cliente de la OT: ver su ficha, editarla (completa o solo sus datos) y registrar uno nuevo con lo
// escrito en la OT. Devuelve los botones, las acciones y los modales para que la OT los coloque.
export default function useClienteOT({
  nuevaOrden, setNuevaOrden, clienteSeleccionado, setClienteSeleccionado,
  setBusquedaCliente, normTxt
}) {
  const [mostrarDetalleCliente, setMostrarDetalleCliente] = useState(false);
  const [mostrarEditarClienteModal, setMostrarEditarClienteModal] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState(null);
  // true = ficha solo con los datos del cliente; false = ficha completa (con contactos y direcciones)
  const [editarSoloCliente, setEditarSoloCliente] = useState(false);
  const [mostrarRegistrarCliente, setMostrarRegistrarCliente] = useState(false);
  const [prefillCliente, setPrefillCliente] = useState(null);

  const abrirEditarCliente = async (soloCliente = false) => {
    setEditarSoloCliente(soloCliente);
    let fresh = clienteSeleccionado;
    try {
      const res = await api.get(`/api/clientes/${clienteSeleccionado.id}`);
      if (res.data) fresh = res.data;
    } catch { /* fallback: datos locales */ }
    setClienteAEditar(fresh);
    setMostrarEditarClienteModal(true);
  };

  const guardarEdicionCliente = async (payload, _resetFn, mantener = false) => {
    if (!clienteAEditar?.id) return;
    try {
      await api.put(`/api/clientes/${clienteAEditar.id}`, payload);
      const freshRes = await api.get(`/api/clientes/${clienteAEditar.id}`);
      const fresh = freshRes.data;

      // Se refrescan los datos propios del cliente. El check "En la OT" solo indica qué
      // contacto/dirección llevar: si al guardar cambió el marcado, la OT toma el nuevo;
      // si no cambió (o no hay ninguno marcado), el contacto y la dirección de la OT no se tocan.
      const esPersonaFresh = fresh.tipo === "PERSONA";
      const cambioContacto = !esPersonaFresh && !!fresh.contacto_nombre && normTxt(fresh.contacto_nombre) !== normTxt(clienteAEditar.contacto_nombre);
      const cambioDireccion = !!fresh.ot_direccion && normTxt(fresh.ot_direccion) !== normTxt(clienteAEditar.ot_direccion);
      setNuevaOrden((prev) => ({
        ...prev,
        cliente: toUpper(fresh.razon_social || ""),
        clienteTipo: esPersonaFresh ? "PERSONA" : "EMPRESA",
        rut: fresh.rut || "",
        email: fresh.email || "",
        fonoPrincipal: fresh.telefono || "",
        ...(cambioContacto ? {
          contacto: toUpper(fresh.contacto_nombre),
          emailContacto: fresh.contacto_email || "",
          fonoContacto: fresh.contacto_fono || "",
          cargoContacto: toUpper(fresh.contacto_cargo || "")
        } : {}),
        ...(cambioDireccion ? {
          direccion: toUpper(fresh.ot_direccion),
          ciudad: toUpper(fresh.ot_ciudad || ""),
          comuna: toUpper(fresh.ot_comuna || "")
        } : {})
      }));

      // El check es de un solo uso: ya se enviaron los datos a la OT, se desmarca
      // (en la edición solo del cliente no se tocan los checks)
      if (!editarSoloCliente) await api.post(`/api/clientes/${clienteAEditar.id}/limpiar-a-ot`);
      const limpio = await api.get(`/api/clientes/${clienteAEditar.id}`);
      if (setClienteSeleccionado) setClienteSeleccionado(limpio.data);

      alert("Cliente actualizado");
      if (mantener) setClienteAEditar(limpio.data);
      else setMostrarEditarClienteModal(false);
    } catch (err) {
      alert(err.response?.data?.msg || "Error al actualizar el cliente");
    }
  };

  const botonesEditarCliente = (
    <>
      <button type="button" className="btn-mini btn-mini--warning" onClick={() => abrirEditarCliente(false)}
        title="Editar el cliente con sus contactos y direcciones">
        <Pencil size={14} /> Editar completo
      </button>
      <button type="button" className="btn-mini btn-mini--warning" onClick={() => abrirEditarCliente(true)}
        title="Editar solo los datos del cliente (razón social, RUT, fono, email)">
        <Pencil size={14} /> Editar
      </button>
    </>
  );

  const abrirRegistrarCliente = async () => {
    // Con el comodín "19" se permite crear aunque el RUT o la razón social ya existan
    if (normalizarRut(nuevaOrden.rut) === "19") {
      setPrefillCliente({
        razon_social: nuevaOrden.cliente || "",
        rut: nuevaOrden.rut || "",
        direccion: nuevaOrden.direccion || "",
        ciudad: nuevaOrden.ciudad || "",
        comuna: nuevaOrden.comuna || "",
        telefono: nuevaOrden.fonoPrincipal || "",
        email: nuevaOrden.email || "",
        contacto_nombre: nuevaOrden.contacto || "",
        contacto_email: nuevaOrden.emailContacto || "",
        contacto_fono: nuevaOrden.fonoContacto || "",
        contacto_cargo: nuevaOrden.cargoContacto || ""
      });
      setMostrarRegistrarCliente(true);
      return;
    }
    // Si el RUT o la razón social ya existen en el mantenedor → solo avisar con el código
    let existente = null;
    try {
      const v = await verificarCliente({ rut: nuevaOrden.rut, razon_social: nuevaOrden.cliente });
      existente = v.porRut || v.porNombre;
    } catch {
      alert("No se pudo comprobar si el cliente ya existe. Revise la conexión e intente de nuevo.");
      return;
    }
    if (existente) {
      alert(`El cliente ya existe (${existente.codigo || "CL-????"}).`);
      setNuevaOrden((prev) => ({ ...prev, rut: "" }));
      return;
    }
    setPrefillCliente({
      razon_social: nuevaOrden.cliente || "",
      rut: nuevaOrden.rut || "",
      direccion: nuevaOrden.direccion || "",
      ciudad: nuevaOrden.ciudad || "",
      comuna: nuevaOrden.comuna || "",
      telefono: nuevaOrden.fonoPrincipal || "",
      email: nuevaOrden.email || "",
      contacto_nombre: nuevaOrden.contacto || "",
      contacto_email: nuevaOrden.emailContacto || "",
      contacto_fono: nuevaOrden.fonoContacto || "",
      contacto_cargo: nuevaOrden.cargoContacto || ""
    });
    setMostrarRegistrarCliente(true);
  };

  const guardarNuevoClienteDesdeOT = async (payload) => {
    try {
      // Con el comodín "19" se crea directo sin chequear duplicados
      // Si ya existe un cliente con ese RUT o razón social → avisar con su código sin crear duplicado
      if (normalizarRut(payload.rut) !== "19") {
        const v = await verificarCliente({ rut: payload.rut, razon_social: payload.razon_social });
        const existente = v.porRut || v.porNombre;
        if (existente) {
          alert(`El cliente ya existe (${existente.codigo || "CL-????"}).`);
          return;
        }
      }
      const res = await api.post("/api/clientes", payload);
      const fresh = res.data?.id ? await clientePorId(res.data.id) : null;
      if (fresh && setClienteSeleccionado) setClienteSeleccionado(fresh);
      if (fresh) {
        setNuevaOrden((prev) => ({
          ...prev,
          cliente: toUpper(fresh.razon_social || "") || prev.cliente,
          clienteTipo: fresh.tipo === "PERSONA" ? "PERSONA" : "EMPRESA",
          rut: fresh.rut || prev.rut,
          email: fresh.email || prev.email,
          fonoPrincipal: fresh.telefono || prev.fonoPrincipal,
          contacto: toUpper(fresh.contacto_nombre || "") || prev.contacto,
          emailContacto: fresh.contacto_email || prev.emailContacto,
          fonoContacto: fresh.contacto_fono || prev.fonoContacto,
          cargoContacto: toUpper(fresh.contacto_cargo || "") || prev.cargoContacto,
          // La dirección marcada "En la OT" viaja igual que el contacto (si no hay ninguna, no se toca)
          direccion: toUpper(fresh.ot_direccion || "") || prev.direccion,
          ciudad: toUpper(fresh.ot_ciudad || "") || prev.ciudad,
          comuna: toUpper(fresh.ot_comuna || "") || prev.comuna
        }));
        setBusquedaCliente(toUpper(fresh.razon_social || ""));
        // El check "En la OT" es de un solo uso: ya viajó, se desmarca (como al editar el cliente)
        try {
          await api.post(`/api/clientes/${fresh.id}/limpiar-a-ot`);
          const limpio = await clientePorId(fresh.id);
          if (limpio && setClienteSeleccionado) setClienteSeleccionado(limpio);
        } catch (e) {
          console.error("No se pudo desmarcar 'En la OT':", e);
        }
      }
      alert(`Cliente registrado (${res.data?.codigo || "CL-????"}). Ya puede guardar la orden.`);
      setMostrarRegistrarCliente(false);
      setPrefillCliente(null);
    } catch (err) {
      alert(err.response?.data?.msg || "Error al registrar el cliente");
    }
  };

  const modalesCliente = (
    <>
      {/* Modal Detalle Cliente (solo lectura) */}
      {mostrarDetalleCliente && clienteSeleccionado && (
        <div className="bc-modal">
          <div className="bc-modal-caja bc-modal-caja--ancha">
            <ClienteFormulario
              clienteEditando={clienteSeleccionado}
              onSave={() => {}}
              onCancel={() => setMostrarDetalleCliente(false)}
              readOnly
            />
          </div>
        </div>
      )}

      {/* Modal Editar Cliente completo desde la OT (portal fuera del form) */}
      {mostrarEditarClienteModal && clienteAEditar && createPortal(
        <div className="bc-modal">
          <div className={`bc-modal-caja ${editarSoloCliente ? "bc-modal-caja--chica" : "bc-modal-caja--ancha"}`}>
            <ClienteFormulario
              clienteEditando={clienteAEditar}
              onSave={guardarEdicionCliente}
              onCancel={() => setMostrarEditarClienteModal(false)}
              soloCliente={editarSoloCliente}
              titulo={editarSoloCliente ? "Editar Cliente" : "Editar Cliente completo"}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Registrar Cliente desde la OT (portal fuera del form) */}
      {mostrarRegistrarCliente && createPortal(
        <div className="bc-modal">
          <div className="bc-modal-caja bc-modal-caja--ancha">
            <ClienteFormulario
              clienteEditando={prefillCliente}
              titulo="Registrar Cliente"
              modoRegistro
              onSave={guardarNuevoClienteDesdeOT}
              onCancel={() => { setMostrarRegistrarCliente(false); setPrefillCliente(null); }}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );

  return {
    botonesEditarCliente,
    abrirRegistrarCliente,
    abrirDetalleCliente: () => setMostrarDetalleCliente(true),
    modalesCliente
  };
}
