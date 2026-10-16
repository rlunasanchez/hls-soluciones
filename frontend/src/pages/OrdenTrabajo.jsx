import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Users, Contact, MapPin, Package, FileText, FileSpreadsheet, ShoppingCart, UserCog,
  Save, X, Wrench, ChevronDown, ChevronUp
} from "lucide-react";
import api from "../services/api";
import { getCached } from "../services/cache";
import { toUpper, capitalizarNombre, cerrarSesion, upperInput, parseToken } from "../utils/helpers";
import { ordenAFormulario, buscarEquipoDeOrden, insumosDeOrden, ordenVacia, insumosVacios } from "../utils/ordenFormato";
import { validarOrden, armarPayloadOrden } from "../utils/validarOrden";
import '../styles/OrdenTrabajo.css';
import "../styles/ordenes-componentes.css";
import HeaderOrdenTrabajo from "../components/ordenes/HeaderOrdenTrabajo";
import OrdenLista from "../components/ordenes/OrdenLista";
import OrdenFormDatos from "../components/ordenes/OrdenFormDatos";
import OrdenFormCliente from "../components/ordenes/OrdenFormCliente";
import OrdenFormEquipo from "../components/ordenes/OrdenFormEquipo";
import OrdenFormInsumos from "../components/ordenes/OrdenFormInsumos";
import OrdenFormAveria from "../components/ordenes/OrdenFormAveria";
import ModalOpcionesPDF from "../components/ordenes/ModalOpcionesPDF";
import OrdenFormAcciones from "../components/ordenes/OrdenFormAcciones";
import useOrdenesListado from "../hooks/useOrdenesListado";


// Nombre y apellido de la sesión actual, para precargar el Técnico Asignado
// en una OT nueva (mismo formato que el resto del campo: mayúsculas, sin
// caracteres que no sean letras/espacios). El campo ya no es editable en el
// formulario, así que si todavía no se cargó el Nombre del usuario, se usa
// el nombre de usuario de login como respaldo (nunca debe quedar vacío).
const tecnicoDeSesion = () => {
  const { nombre, usuario } = parseToken();
  return toUpper(nombre || usuario || "").replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '');
};

function OrdenTrabajo() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Listado de órdenes: carga, filtros y paginación
  const {
    ordenes, loading, fetchOrdenes, ordenesPag, totalPaginas, paginaActual, setPaginaActual,
    filtroNumeroOrden, setFiltroNumeroOrden, filtroCliente, setFiltroCliente, filtroSerie, setFiltroSerie,
    filtroEstado, setFiltroEstado, filtroGarantia, setFiltroGarantia,
    filtroFechaDesde, setFiltroFechaDesde, filtroFechaHasta, setFiltroFechaHasta
  } = useOrdenesListado();
  const [editingId, setEditingId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);

  // Id de la orden abierta en el formulario, tanto en modo Editar como en modo
  // Ver (a diferencia de editingId, que en modo Ver queda en null). Sirve para
  // consultar las cotizaciones asociadas sin importar el modo.
  const [ordenIdActual, setOrdenIdActual] = useState(null);
  const [cotizacionesDeOrden, setCotizacionesDeOrden] = useState([]);
  const [mostrarCotizacionesAsociadas, setMostrarCotizacionesAsociadas] = useState(false);
  // Dentro del bloque expandido se muestran como máximo COTIZ_VISIBLES chips;
  // el resto queda tras un "Ver N más".
  const [verTodasCotizaciones, setVerTodasCotizaciones] = useState(false);
  const COTIZ_VISIBLES = 3;

  // Estados para autocompletar clientes y equipos
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteFijo, setClienteFijo] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [equipoFijo, setEquipoFijo] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaModelo, setBusquedaModelo] = useState("");
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [mostrarDropdownModelo, setMostrarDropdownModelo] = useState(false);
  const [equiposModeloSugeridos, setEquiposModeloSugeridos] = useState([]);
  const [clienteInactivo, setClienteInactivo] = useState(false);
  const [soloLectura, setSoloLectura] = useState(false);
  const [ordenParaPDF, setOrdenParaPDF] = useState(null);
  
  // Refs para detectar clics fuera de los dropdowns
  const equipoModeloDropdownRef = useRef(null);
  const clienteDropdownRef = useRef(null);
  
  // Insumos dinámicos (se muestran de a 2; hasta 12)
  const [insumos, setInsumos] = useState(insumosVacios);
  const [insumosVisibles, setInsumosVisibles] = useState(2);

  // Estado principal de la orden
  const [nuevaOrden, setNuevaOrden] = useState(() => ordenVacia(tecnicoDeSesion()));

  // Cargar clientes, equipos y órdenes al montar el componente
  useEffect(() => {
    const controller = new AbortController();
    fetchClientes(controller.signal);
    fetchEquipos(controller.signal);
    fetchOrdenes(controller.signal);
    return () => controller.abort();
  }, []);

  // Recibir cliente u orden desde Clientes
  useEffect(() => {
    const init = async () => {
      const navState = window.history.state?.usr;
      
      // Limpiar siempre al inicio
      setMostrarFormulario(false);
      setEditingId(null);
      
      // Solo procesar si hay datos de cliente, orden, o una orden puntual a reabrir
      if (!navState || (!navState?.cliente && !navState?.orden && !navState?.verOrdenId)) return;

      const ordenFromNav = navState?.orden;
      const clienteFromNav = navState?.cliente;
      const verOrdenId = navState?.verOrdenId;
      const verOrdenSoloLectura = navState?.verOrdenSoloLectura;

      if (ordenFromNav) {
        // Cargar clientes frescos antes de editar la orden
        await fetchClientes();
        await fetchEquipos();
        editarOrden(ordenFromNav);
        window.history.replaceState({}, document.title);
      }

      // Volver a la OT desde la que se abrió una cotización asociada (chip
      // "Cotizaciones Asociadas" → Cancelar/Cerrar en la Cotización), en el
      // mismo modo en que estaba: Ver o Editar.
      if (verOrdenId) {
        await fetchClientes();
        await fetchEquipos();
        if (verOrdenSoloLectura) {
          verOrden({ id: verOrdenId });
        } else {
          editarOrden({ id: verOrdenId });
        }
        window.history.replaceState({}, document.title);
      }

      if (clienteFromNav) {
        const fechaActual = new Date().toISOString().split("T")[0];
        const numeroOt = await calcularSiguienteNumeroOrden();
        setEditingId(null);
        setClienteSeleccionado(clienteFromNav);
        setClienteFijo(false);
        setClienteInactivo(false);
        setEquipoSeleccionado(null);
        setEquipoFijo(false);
        setBusquedaCliente("");
    setBusquedaModelo("");
    setEquiposModeloSugeridos([]);
        setInsumos(insumosVacios());
        setInsumosVisibles(2);
        setNuevaOrden({
          ...ordenVacia(tecnicoDeSesion()),
          numeroOrden: numeroOt,
          fecha: fechaActual,
          cliente: (clienteFromNav.razon_social || "").toUpperCase(),
          // Desde el botón OT del cliente viaja solo lo marcado "En la OT" (sin marca, vacío)
          direccion: (clienteFromNav.ot_direccion || "").toUpperCase(),
          ciudad: (clienteFromNav.ot_ciudad || "").toUpperCase(),
          comuna: (clienteFromNav.ot_comuna || "").toUpperCase(),
          rut: clienteFromNav.rut || "",
          email: clienteFromNav.email || "",
          fonoPrincipal: clienteFromNav.telefono || "",
          contacto: (clienteFromNav.contacto_nombre || "").toUpperCase(),
          fonoContacto: clienteFromNav.contacto_fono || "",
          emailContacto: clienteFromNav.contacto_email || "",
          cargoContacto: (clienteFromNav.contacto_cargo || "").toUpperCase(),
          clienteTipo: clienteFromNav.tipo === "PERSONA" ? "PERSONA" : "EMPRESA"
        });
      setMostrarFormulario(true);
    }
    };
    init();
  }, []);

  // Función para calcular siguiente número de OT correlativo
  const calcularSiguienteNumeroOrden = async () => {
    try {
      const res = await api.get("/api/ordenes/siguiente-numero");
      return res.data.numeroOrden;
    } catch (err) {
      const year = new Date().getFullYear();
      return `OT-${year}-0001`;
    }
  };

  // Función para abrir formulario de nueva orden con valores automáticos
  const abrirNuevaOrden = async () => {
    await fetchClientes();
    const fechaActual = new Date().toISOString().split("T")[0];
    const numeroOt = await calcularSiguienteNumeroOrden();
    setNuevaOrden(prev => ({
      ...prev,
      numeroOrden: numeroOt,
      fecha: fechaActual
    }));
    setEditingId(null);
    setOrdenIdActual(null);
    setSoloLectura(false);
    setClienteSeleccionado(null);
    setClienteFijo(false);
    setEquipoSeleccionado(null);
    setEquipoFijo(false);
    setClienteInactivo(false);
    setBusquedaCliente("");
    setBusquedaModelo("");
    setEquiposModeloSugeridos([]);
    setInsumos(insumosVacios());
    setInsumosVisibles(2);
    setMostrarFormulario(true);
  };

  // Si el cliente de la OT ya está seleccionado (porque se registró de nuevo o se eligió otro),
  // deja de estar "desactivado": se quita el aviso sin tener que salir y volver a entrar.
  useEffect(() => {
    if (clienteSeleccionado) setClienteInactivo(false);
  }, [clienteSeleccionado]);

  // Cotizaciones asociadas a la orden abierta (solo lectura, para el badge y
  // los chips del header). Se re-consulta cada vez que cambia la orden abierta.
  useEffect(() => {
    setVerTodasCotizaciones(false);
    if (!ordenIdActual) { setCotizacionesDeOrden([]); return; }
    const controller = new AbortController();
    api.get(`/api/cotizaciones?orden_id=${ordenIdActual}&limit=100`, { signal: controller.signal })
      .then((res) => setCotizacionesDeOrden(res.data.cotizaciones || []))
      .catch((err) => { if (err.name !== "CanceledError") setCotizacionesDeOrden([]); });
    return () => controller.abort();
  }, [ordenIdActual]);

  // Buscar equipos por modelo via API
  useEffect(() => {
    if (busquedaModelo.length < 2) { setEquiposModeloSugeridos([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/equipos?q=${encodeURIComponent(busquedaModelo)}`);
        setEquiposModeloSugeridos(res.data);
      } catch { setEquiposModeloSugeridos([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaModelo]);

  // Cierra los dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (equipoModeloDropdownRef.current && !equipoModeloDropdownRef.current.contains(event.target)) {
        setMostrarDropdownModelo(false);
      }
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target)) {
        setMostrarDropdownClientes(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Abre una orden guardada en el formulario. modo "editar" la deja editable; modo "ver", en solo lectura.
  // El listado no trae "adjunto" (es pesado): la orden completa se pide recién al abrirla.
  const cargarOrden = async (ordenListado, modo) => {
    const { data: orden } = await api.get(`/api/ordenes/${ordenListado.id}`);

    setSoloLectura(modo === "ver");
    setEditingId(modo === "editar" ? orden.id : null);
    setOrdenIdActual(orden.id);
    setClienteFijo(false);
    setEquipoFijo(false);
    setMostrarFormulario(true);

    // Los campos de la OT son una copia (snapshot): no se pisan con datos frescos del cliente/equipo
    setNuevaOrden(ordenAFormulario(orden));

    // Si el equipo coincide con un registro del mantenedor se marca como seleccionado
    // (habilita los botones Ver/Editar del equipo)
    setEquipoSeleccionado(buscarEquipoDeOrden(orden, equipos));

    // Cliente asociado: solo para badge/estado
    const cl = clientes.find((c) =>
      (orden.cliente_id && c.id === orden.cliente_id) || (orden.cliente && c.razon_social === orden.cliente)
    );
    let seleccionado = cl || null;
    let inactivo = false;
    if (!cl && orden.cliente_id) {
      try {
        const resCli = await getCached(`/api/clientes`);
        seleccionado = resCli.data.find((c) => c.id === orden.cliente_id) || null;
      } catch { /* sin conexión: se trata como no encontrado */ }
      inactivo = !seleccionado;
    }
    setClienteSeleccionado(seleccionado);
    setClienteInactivo(inactivo);
    setBusquedaCliente("");

    const { insumos: lista, visibles } = insumosDeOrden(orden);
    setInsumos(lista);
    setInsumosVisibles(visibles);
  };

  const editarOrden = (orden) => cargarOrden(orden, "editar");
  const verOrden = (orden) => cargarOrden(orden, "ver");

  const eliminarOrden = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar esta orden de trabajo?")) return;
    try {
      await api.delete(`/api/ordenes/${id}`);
      fetchOrdenes();
    } catch (err) {
      console.error("Error al eliminar orden:", err);
      alert("Error al eliminar la orden");
    }
  };

  const fetchClientes = async (signal) => {
    try {
      const res = await getCached("/api/clientes", { signal });
      setClientes(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar clientes:", err);
    }
  };

  const fetchEquipos = async (signal) => {
    try {
      const res = await getCached("/api/equipos", { signal });
      setEquipos(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar equipos:", err);
    }
  };

  // Seleccionar cliente y cargar sus datos
  // Una persona no tiene contacto: va sin datos de contacto y con la dirección que tiene vinculada
  // (copia, snapshot). En una empresa el contacto y la dirección se eligen aparte.
  const datosDelTipo = (cliente) => cliente.tipo === "PERSONA"
    ? {
        clienteTipo: "PERSONA",
        contacto: "",
        fonoContacto: "",
        emailContacto: "",
        cargoContacto: "",
        // Su dirección es la que tiene vinculada en el mantenedor de Direcciones
        direccion: toUpper(cliente.ot_direccion),
        ciudad: toUpper(cliente.ot_ciudad),
        comuna: toUpper(cliente.ot_comuna)
      }
    : { clienteTipo: "EMPRESA" };

  const seleccionarCliente = (cliente) => {
    const mismoCliente = clienteSeleccionado?.id === cliente.id;
    setClienteSeleccionado(cliente);
    setClienteInactivo(false);
    setBusquedaCliente("");
    setMostrarDropdownClientes(false);

    // Cliente (re)seleccionado en una OT guardada: solo se llevan sus datos propios.
    // El contacto y la dirección salen y se eligen de nuevo con sus buscadores
    // (no se toca el equipo). Igual que en una OT nueva.
    if (mismoCliente && editingId) {
      setNuevaOrden(prev => ({
        ...prev,
        cliente: toUpper(cliente.razon_social),
        direccion: "",
        ciudad: "",
        comuna: "",
        rut: cliente.rut || "",
        email: cliente.email || "",
        fonoPrincipal: cliente.telefono || "",
        contacto: "",
        fonoContacto: "",
        emailContacto: "",
        cargoContacto: "",
        ...datosDelTipo(cliente)
      }));
      return;
    }

    // En modo edicion, solo actualizar datos del cliente sin limpiar equipo; el contacto
    // y la dirección se eligen con sus buscadores
    if (editingId) {
      setNuevaOrden(prev => ({
        ...prev,
        cliente: toUpper(cliente.razon_social),
        direccion: "",
        ciudad: "",
        comuna: "",
        rut: cliente.rut || "",
        email: cliente.email || "",
        fonoPrincipal: cliente.telefono || "",
        contacto: "",
        fonoContacto: "",
        emailContacto: "",
        cargoContacto: "",
        contactosExtra: [],
        direccionesExtra: [],
        ...datosDelTipo(cliente)
      }));
      return;
    }

    setEquipoSeleccionado(null);
    setBusquedaModelo("");
    // OT desde cero: al elegir el cliente solo se llevan sus datos (razón social, RUT, fono,
    // email). El contacto y la dirección no vienen por defecto: se eligen en sus buscadores.
    setNuevaOrden(prev => ({
      ...prev,
      cliente: toUpper(cliente.razon_social),
      direccion: "",
      ciudad: "",
      comuna: "",
      rut: cliente.rut || "",
      email: cliente.email || "",
      fonoPrincipal: cliente.telefono || "",
      contacto: "",
      fonoContacto: "",
      emailContacto: "",
      cargoContacto: "",
      contactosExtra: [],
      direccionesExtra: [],
      equipo: "",
      modelo: "",
      marca: "",
      serie: "",
      nivelTinta: "",
      contadorPagOut: "",
      averia: "",
      actividad: "",
      observaciones: "",
      ...datosDelTipo(cliente)
    }));
  };

  // Seleccionar solo el modelo - NO vincula serie ni equipo (solo rellena los datos del modelo)
  const seleccionarEquipoPorModelo = (equipo) => {
    setNuevaOrden(prev => ({
      ...prev,
      equipo: toUpper(equipo.equipo),
      modelo: toUpper(equipo.modelo),
      marca: toUpper(equipo.marca),
      serie: ""
      // NOTA: No vincula equipo (equipoId = null) ni serie, solo los datos del modelo
    }));

     setBusquedaModelo((equipo.modelo || "").toUpperCase());
     setMostrarDropdownModelo(false);
  };

  // Filtrar clientes para la búsqueda (local)
  // El RUT se compara por dígitos (ignora puntos, guion y DV): buscar "14900" encuentra "14.900.665-6"
  const digRut = (v) => (v || "").replace(/[^0-9]/g, "");
  const qCliente = busquedaCliente.toLowerCase();
  const qDig = digRut(busquedaCliente);
  const esNumerico = /^[0-9]/.test(busquedaCliente.trim());
  const clientesFiltrados = busquedaCliente.length >= 2 ? clientes.filter(c => 
    c.razon_social?.toLowerCase().includes(qCliente) ||
    (esNumerico && qDig && digRut(c.rut).includes(qDig)) ||
    c.codigo?.toLowerCase().includes(qCliente)
  ).slice(0, 10) : [];

  // Modelos únicos (sin duplicar por serie) para el buscador de modelo
  const equiposModeloFiltrados = [...new Map(equiposModeloSugeridos.map(eq => [eq.modelo, eq])).values()];

  // Registra el equipo del form OT en el mantenedor (la serie es opcional).
  // Se usa desde el botón "+ Registrar en Equipos" al crear o editar una OT.
  const registrarEquipoEnMantenedor = async () => {
    const { equipo, marca, modelo, serie } = nuevaOrden;
    try {
      const res = await api.post("/api/equipos", { equipo, marca, modelo, serie });
      alert(`Equipo creado en el mantenedor con código ${res.data.codigo}.`);
      const lista = await api.get("/api/equipos");
      setEquipos(lista.data);
    } catch (err) {
      const msg = err.response?.data?.msg;
      alert(msg || "Error al registrar el equipo en el mantenedor.");
    }
  };

  // PDF y Cotización de la orden que está abierta en el formulario (ya
  // guardada al menos una vez, con editingId). Traen los datos frescos de
  // la orden para no trabajar con lo que quedó en el estado del formulario.
  const generarPDFOrdenActual = async () => {
    if (!editingId) return;
    const res = await api.get(`/api/ordenes/${editingId}`);
    setOrdenParaPDF(res.data);
  };

  const irACotizacionOrdenActual = async () => {
    if (!editingId) return;
    const res = await api.get(`/api/ordenes/${editingId}`);
    navigate('/cotizaciones', { state: { orden: res.data } });
  };

  const guardarOrden = async (e, mantener = false) => {
    e.preventDefault();
    if (guardandoRef.current) return;

    const mensajeError = validarOrden(nuevaOrden, { clientes, clienteSeleccionado });
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
        // "Guardar Cambios"/"Guardar": guarda y se mantiene en la OT para seguir editando o generar el PDF
        const res = await api.get(`/api/ordenes/${idActual}`);
        await editarOrden(res.data);
      } else {
        alert(eraOrdenNueva ? "Orden guardada exitosamente" : "Orden actualizada exitosamente");
        setMostrarFormulario(false);
        resetFormulario();
        setSoloLectura(false);
        window.history.replaceState({}, document.title);
        // Guardar (a diferencia de Cancelar/X) siempre deja en el mantenedor de OT,
        // aunque se haya creado desde Clientes — para eso está el listado de OT.
        // Una orden nueva queda primera (backend ordena por id DESC): saltar a la página 1 para verla.
        // Al editar se conserva la página en la que estaba el usuario.
        if (eraOrdenNueva) setPaginaActual(1);
        fetchOrdenes();
      }
    } catch (err) {
      console.error("Error al guardar orden:", err);
      alert("Error al guardar la orden");
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  const resetFormulario = () => {
    setNuevaOrden(ordenVacia(tecnicoDeSesion()));
    setInsumos(insumosVacios());
    setInsumosVisibles(2);
    setClienteSeleccionado(null);
    setClienteFijo(false);
    setEquipoSeleccionado(null);
    setEquipoFijo(false);
    setBusquedaCliente("");
    setBusquedaModelo("");
    setEquiposModeloSugeridos([]);
    setMostrarDropdownModelo(false);
    setClienteInactivo(false);
    setEditingId(null);
  };

  // Cerrar el formulario (X o Cancelar/Cerrar): si no se viene de Clientes,
  // refresca la lista para reflejar los cambios guardados con "Guardar Cambios"
  const cerrarFormulario = () => {
    const navState = window.history.state?.usr;
    const vinoDeCliente = navState?.cliente || navState?.orden;
    setMostrarFormulario(false);
    resetFormulario();
    setEditingId(null);
    setOrdenIdActual(null);
    setMostrarCotizacionesAsociadas(false);
    setSoloLectura(false);
    window.history.replaceState({}, document.title);
    if (vinoDeCliente) {
      navigate("/clientes");
    } else {
      fetchOrdenes();
    }
  };
  // Funciones de navegación eliminadas (accesos desde el menú)

  const navItems = [
    { label: "Inicio", icon: Home, onClick: () => navigate("/home"), color: "var(--gradient)" },
    { label: "Clientes", icon: Users, onClick: () => navigate("/clientes"), color: "var(--primary)" },
    { label: "Contactos", icon: Contact, onClick: () => navigate("/contactos"), color: "#7C3AED" },
    { label: "Direcciones", icon: MapPin, onClick: () => navigate("/direcciones"), color: "#0891B2" },
    { label: "Equipos", icon: Package, onClick: () => navigate("/equipos"), color: "var(--success)" },
    { label: "Informes Técnicos", icon: FileText, onClick: () => navigate("/informes"), color: "#EA580C" },
    { label: "Cotizaciones", icon: FileSpreadsheet, onClick: () => navigate("/cotizaciones"), color: "#DB2777" },
    { label: "Orden de Compra", icon: ShoppingCart, onClick: () => navigate("/orden-compra"), color: "#1E40AF" },
    { label: "Usuarios", icon: UserCog, onClick: () => navigate("/usuarios"), color: "#0D9488" },
  ];

  return (
    <div className="container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <HeaderOrdenTrabajo navItems={navItems} onLogout={cerrarSesion} />

      {!mostrarFormulario ? (
          <div className="ot-list-wrap">
          <OrdenLista
            ordenes={ordenesPag}
            loading={loading}
            filtroNumeroOrden={filtroNumeroOrden}
            onFiltroChange={setFiltroNumeroOrden}
            filtroCliente={filtroCliente}
            onFiltroClienteChange={setFiltroCliente}
            filtroSerie={filtroSerie}
            onFiltroSerieChange={setFiltroSerie}
            filtroEstado={filtroEstado}
            onFiltroEstadoChange={setFiltroEstado}
            filtroGarantia={filtroGarantia}
            onFiltroGarantiaChange={setFiltroGarantia}
            filtroFechaDesde={filtroFechaDesde}
            onFiltroFechaDesdeChange={setFiltroFechaDesde}
            filtroFechaHasta={filtroFechaHasta}
            onFiltroFechaHastaChange={setFiltroFechaHasta}
            onLimpiar={() => { setFiltroNumeroOrden(""); setFiltroCliente(""); setFiltroSerie(""); setFiltroEstado("todos"); setFiltroGarantia("todos"); setFiltroFechaDesde(""); setFiltroFechaHasta(""); }}
            onNueva={abrirNuevaOrden}
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onPageChange={setPaginaActual}
            onVer={verOrden}
            onEditar={editarOrden}
            onEliminar={eliminarOrden}
            onInforme={(orden) => navigate('/informes', { state: { orden } })}
            onCotizacion={(orden) => navigate('/cotizaciones', { state: { orden } })}
            onPDF={setOrdenParaPDF}
          />
          </div>
        ) : (
          /* Formulario para crear orden */
          <>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px' }}>
            <div className="of-wrap">
              <div className="of-head">
                <h2><Wrench size={20} /> {soloLectura ? "Ver Orden" : editingId ? "Editar Orden" : "Nueva Orden"}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {(ordenIdActual ? nuevaOrden.tecnicoAsignado : tecnicoDeSesion()) && (
                    <span style={{ fontWeight: 600, fontSize: '0.75rem', color: '#fff', background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: 999 }}>
                      Técnico: {capitalizarNombre(ordenIdActual ? nuevaOrden.tecnicoAsignado : tecnicoDeSesion())}
                    </span>
                  )}
                  {cotizacionesDeOrden.length > 0 && (
                    <span style={{ fontWeight: 600, fontSize: '0.75rem', color: '#fff', background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: 999 }}>
                      Cotizaciones: {cotizacionesDeOrden.length}
                    </span>
                  )}
                  <button type="button" className="of-head-close" onClick={cerrarFormulario}><X size={18} /></button>
                </div>
              </div>
            <form onSubmit={guardarOrden} className="of-form" noValidate>
              <div className="of-col-full">
                <OrdenFormDatos
                  nuevaOrden={nuevaOrden}
                  setNuevaOrden={setNuevaOrden}
                  readOnly={soloLectura}
                />
              </div>

              <div className="of-cols">
                <div className="of-col-left">
                <OrdenFormCliente
                  busquedaCliente={busquedaCliente}
                  setBusquedaCliente={setBusquedaCliente}
                  mostrarDropdownClientes={mostrarDropdownClientes}
                  setMostrarDropdownClientes={setMostrarDropdownClientes}
                  clienteSeleccionado={clienteSeleccionado}
                  clientesFiltrados={clientesFiltrados}
                  clienteDropdownRef={clienteDropdownRef}
                  seleccionarCliente={seleccionarCliente}
                  nuevaOrden={nuevaOrden}
                  setNuevaOrden={setNuevaOrden}
                  clientes={clientes}
                  clienteInactivo={clienteInactivo}
                  clienteFijo={clienteFijo}
                  readOnly={soloLectura}
                  setClienteSeleccionado={setClienteSeleccionado}
                  onClientesRefresh={(lista) => setClientes(lista)}
                />

                {cotizacionesDeOrden.length > 0 && (
                  <div style={{ marginTop: '10px', padding: '4px 10px', background: '#FEF9E7', border: '1px solid #F5D48C', borderRadius: '8px', lineHeight: '1.2' }}>
                    <button
                      type="button"
                      onClick={() => { setMostrarCotizacionesAsociadas(!mostrarCotizacionesAsociadas); setVerTodasCotizaciones(false); }}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit' }}
                    >
                      {mostrarCotizacionesAsociadas ? <ChevronUp size={14} style={{ color: '#B45309', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: '#B45309', flexShrink: 0 }} />}
                      Cotizaciones Asociadas
                      <span style={{
                        background: '#B45309', color: 'white', padding: '1px 8px', borderRadius: '10px',
                        fontSize: '0.75rem', fontWeight: '700'
                      }}>
                        {cotizacionesDeOrden.length}
                      </span>
                    </button>

                    {mostrarCotizacionesAsociadas && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '8px', alignItems: 'center' }}>
                        {(verTodasCotizaciones ? cotizacionesDeOrden : cotizacionesDeOrden.slice(0, COTIZ_VISIBLES)).map((c) => (
                          <span key={c.id}
                            onClick={() => navigate('/cotizaciones', { state: { cotizacionId: c.id, cotizacionSoloLectura: soloLectura, volverOrdenId: ordenIdActual, volverOrdenSoloLectura: soloLectura } })}
                            title="Ver esta cotización"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                              background: 'var(--primary-light)', color: 'var(--primary)',
                              border: '1px solid var(--primary)', borderRadius: 999,
                              padding: '3px 10px', fontSize: '.75rem', fontWeight: 600
                            }}
                          >
                            N° {c.folio}
                          </span>
                        ))}
                        {cotizacionesDeOrden.length > COTIZ_VISIBLES && (
                          <button
                            type="button"
                            onClick={() => setVerTodasCotizaciones(!verTodasCotizaciones)}
                            style={{
                              background: 'none', border: 'none', padding: '3px 4px', cursor: 'pointer',
                              color: '#B45309', fontSize: '.75rem', fontWeight: 700, fontFamily: 'inherit'
                            }}
                          >
                            {verTodasCotizaciones ? 'Ver menos' : `Ver ${cotizacionesDeOrden.length - COTIZ_VISIBLES} más`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                </div>

                <div className="of-col-right">
                <OrdenFormEquipo
                  busquedaModelo={busquedaModelo}
                  setBusquedaModelo={setBusquedaModelo}
                  mostrarDropdownModelo={mostrarDropdownModelo}
                  setMostrarDropdownModelo={setMostrarDropdownModelo}
                  equiposModeloFiltrados={equiposModeloFiltrados}
                  equipoModeloDropdownRef={equipoModeloDropdownRef}
                  seleccionarEquipoPorModelo={seleccionarEquipoPorModelo}
                  equipoSeleccionado={equipoSeleccionado}
                  nuevaOrden={nuevaOrden}
                  setNuevaOrden={setNuevaOrden}
                  readOnly={soloLectura}
                  equipos={equipos}
                  equipoFijo={equipoFijo}
                  editingId={editingId}
                  onRegistrarEquipo={registrarEquipoEnMantenedor}
                  onEquiposRefresh={(lista) => setEquipos(lista)}
                />

                <OrdenFormInsumos
                  insumos={insumos}
                  insumosVisibles={insumosVisibles}
                  setInsumosVisibles={setInsumosVisibles}
                  setInsumos={setInsumos}
                  readOnly={soloLectura}
                />

                  <OrdenFormAveria
                    nuevaOrden={nuevaOrden}
                    setNuevaOrden={setNuevaOrden}
                    readOnly={soloLectura}
                  />

                  <div className="of-sec muted">
                    <div className="of-st primary">Observaciones</div>
                    <div className="of-f">
                      <textarea
                        placeholder="Observaciones adicionales..."
                        value={nuevaOrden.observaciones}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, observaciones: upperInput(e)})}
                        rows={4}
                        disabled={soloLectura}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción del formulario */}
              <div className="of-sub">
                <button type="button" className="of-btn-c" onClick={cerrarFormulario}>
                  <X size={16} /> {soloLectura ? "Cerrar" : "Cancelar"}
                </button>
                {!soloLectura && (
                  <button type="button" className="of-btn-s" onClick={(e) => guardarOrden(e, true)} disabled={guardando}>
                    <Save size={16} /> {guardando ? "Guardando..." : (editingId ? "Guardar Cambios" : "Guardar")}
                  </button>
                )}
                {!soloLectura && (
                  <button type="submit" className="of-btn-p" disabled={guardando}>
                    <Save size={16} /> {guardando ? "Guardando..." : (editingId ? "Cerrar" : "Guardar Orden")}
                  </button>
                )}
                {editingId && (
                  <OrdenFormAcciones onPDF={generarPDFOrdenActual} onCotizacion={irACotizacionOrdenActual} />
                )}
              </div>
            </form>
            </div>
          </div></>
        )}

      {ordenParaPDF && (
        <ModalOpcionesPDF orden={ordenParaPDF} onClose={() => setOrdenParaPDF(null)} />
      )}
    </div>
  );
}

export default OrdenTrabajo;