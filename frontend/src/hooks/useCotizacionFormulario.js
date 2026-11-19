import { useState, useRef, useCallback, useEffect } from "react";
import api from "../services/api";
import { invalidar } from "../services/cache";
import { parseToken } from "../utils/helpers";
import { clienteDeOrden } from "../utils/clientesApi";
import { datosAlElegirCliente } from "../utils/ordenFormato";
import { cotizacionVacia, cotizacionAFormulario, formularioAPayload } from "../utils/cotizacionFormato";
import useBusquedaApi from "./useBusquedaApi";
import useClicFuera from "./useClicFuera";

// Estado y acciones del formulario de una cotización (nueva, ver o editar): el formulario, el cliente
// elegido (con su buscador en el servidor, como la OT), de dónde se entró (listado u OT) y guardar.
// `navigate` y `alGuardar` los pone la pantalla: alGuardar(eraNueva) refresca el listado.
export default function useCotizacionFormulario({ navigate, alGuardar }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);
  const [cotizacion, setCotizacion] = useState(cotizacionVacia);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteInactivo, setClienteInactivo] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const clienteDropdownRef = useRef(null);
  useClicFuera(clienteDropdownRef, useCallback(() => setMostrarDropdownClientes(false), []));
  const [resultadosCliente] = useBusquedaApi("/api/clientes", busquedaCliente);
  const clientesFiltrados = busquedaCliente.length >= 2 ? resultadosCliente : [];

  // "Por dónde entré al formulario": desde la OT (Cancelar/Guardar vuelven a ella) o desde el listado.
  const [origenOT, setOrigenOT] = useState(false);
  const [ordenOrigen, setOrdenOrigen] = useState(null);

  // Nombre y email del ejecutivo salen de la BD (/perfil) para reflejar los cambios de Usuarios sin
  // cerrar sesión; si falla, del token.
  const perfilRef = useRef(null);
  const cargarPerfil = useCallback(async () => {
    if (perfilRef.current) return perfilRef.current;
    try {
      perfilRef.current = (await api.get("/api/auth/perfil")).data;
    } catch {
      const t = parseToken();
      perfilRef.current = { usuario: t.usuario, nombre: t.nombre, email: t.email };
    }
    return perfilRef.current;
  }, []);
  useEffect(() => { cargarPerfil(); }, [cargarPerfil]);

  const nuevaCotizacion = () => {
    const base = cotizacionVacia();
    const p = perfilRef.current;
    if (p) {
      base.ejecutivo = p.nombre || p.usuario || base.ejecutivo;
      base.ejecutivoEmail = p.email || base.ejecutivoEmail;
    }
    return base;
  };

  // Si en el formulario se registra o cambia el cliente, la cotización queda con su id.
  useEffect(() => {
    if (clienteSeleccionado?.id) setCotizacion((prev) => (prev.clienteId === clienteSeleccionado.id ? prev : { ...prev, clienteId: clienteSeleccionado.id }));
  }, [clienteSeleccionado?.id]);

  const limpiarFormulario = () => {
    setEditingId(null);
    setSoloLectura(false);
    setClienteSeleccionado(null);
    setClienteInactivo(false);
    setBusquedaCliente("");
    setOrigenOT(false);
    setOrdenOrigen(null);
  };

  // Abre el formulario con una cotización ya armada y su cliente (nueva desde la OT o desde Clientes).
  const abrirConDatos = ({ datos, cliente = null, desdeOT = false }) => {
    limpiarFormulario();
    setClienteSeleccionado(cliente);
    setOrigenOT(desdeOT);
    setCotizacion(datos);
    setMostrarFormulario(true);
  };

  const abrirNueva = async () => {
    await cargarPerfil();
    abrirConDatos({ datos: nuevaCotizacion() });
  };

  const cargarCotizacion = async (cot, readOnly) => {
    const c = (await api.get(`/api/cotizaciones/${cot.id}`)).data;
    const { cliente, inactivo } = await clienteDeOrden({ cliente_id: c.cliente_id, cliente: c.cliente_razon_social });
    limpiarFormulario();
    setEditingId(c.id);
    setSoloLectura(readOnly);
    setClienteSeleccionado(cliente);
    setClienteInactivo(inactivo);
    setCotizacion(cotizacionAFormulario(c, cliente?.tipo));
    setMostrarFormulario(true);
  };

  // Elegir un cliente: se llevan sus datos propios; el contacto y la dirección se eligen aparte
  // (una persona trae la suya). Mismas reglas que la OT (datosAlElegirCliente).
  const seleccionarCliente = (cliente) => {
    const mismoCliente = clienteSeleccionado?.id === cliente.id;
    setClienteSeleccionado(cliente);
    setClienteInactivo(false);
    setBusquedaCliente("");
    setMostrarDropdownClientes(false);
    setCotizacion((prev) => ({ ...prev, clienteId: cliente.id, ...datosAlElegirCliente(cliente, { editando: true, mismoCliente }) }));
  };

  const cerrarFormulario = () => {
    const vuelveAOT = origenOT;
    const destino = ordenOrigen;
    setMostrarFormulario(false);
    setCotizacion(cotizacionVacia());
    limpiarFormulario();
    if (vuelveAOT) {
      // Desde el chip "Cotizaciones Asociadas" de una OT puntual se reabre en el mismo modo (Ver/Editar).
      navigate("/orden-trabajo", destino ? { state: { verOrdenId: destino.id, verOrdenSoloLectura: destino.soloLectura } } : undefined);
    }
  };

  const guardarCotizacion = async (e, mantener = false) => {
    e.preventDefault();
    if (guardandoRef.current) return;
    const eraNueva = !editingId;
    guardandoRef.current = true;
    setGuardando(true);
    try {
      const payload = formularioAPayload(cotizacion);
      let idActual = editingId;
      if (editingId) {
        await api.put(`/api/cotizaciones/${editingId}`, payload);
      } else {
        idActual = (await api.post("/api/cotizaciones", payload)).data.id;
        setEditingId(idActual);
      }
      // El listado de OT marca las órdenes con cotizaciones y está en caché: se invalida tras guardar.
      invalidar("/api/ordenes");
      if (mantener) {
        const origenAntes = origenOT;
        await cargarCotizacion({ id: idActual }, false);
        setOrigenOT(origenAntes);
      } else {
        alert(eraNueva ? "Cotización guardada exitosamente" : "Cotización actualizada exitosamente");
        const vuelveAOT = origenOT;
        cerrarFormulario();
        if (!vuelveAOT) alGuardar(eraNueva);
      }
    } catch (err) {
      console.error("Error al guardar cotización:", err);
      alert(err.response?.data?.msg || "Error al guardar la cotización");
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  return {
    mostrarFormulario, editingId, soloLectura, guardando,
    cotizacion, setCotizacion,
    clienteSeleccionado, setClienteSeleccionado, clienteInactivo,
    busquedaCliente, setBusquedaCliente, mostrarDropdownClientes, setMostrarDropdownClientes,
    clienteDropdownRef, clientesFiltrados, seleccionarCliente,
    setOrigenOT, setOrdenOrigen, cargarPerfil, nuevaCotizacion,
    abrirNueva, abrirConDatos, cargarCotizacion, cerrarFormulario, guardarCotizacion
  };
}
