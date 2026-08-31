import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Users, Package, FileText, FileSpreadsheet, ShoppingCart, UserCog,
  Save, X, Wrench
} from "lucide-react";
import api from "../services/api";
import { getCached } from "../services/cache";
import { toUpper, cerrarSesion, upperInput, validarRUT, normalizarRut, validarEmail } from "../utils/helpers";
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
import { usePaginaPersistente, useClampPagina } from "../hooks/usePaginacion";


function OrdenTrabajo() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estados para listar órdenes con paginación
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const ITEMS_POR_PAG = 4;
  const [editingId, setEditingId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);
  const [filtroNumeroOrden, setFiltroNumeroOrden] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroSerie, setFiltroSerie] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroGarantia, setFiltroGarantia] = useState("todos");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [paginaActual, setPaginaActual] = usePaginaPersistente("pagOrdenes", [
    filtroNumeroOrden, filtroCliente, filtroSerie, filtroEstado, filtroGarantia, filtroFechaDesde, filtroFechaHasta
  ]);
  
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
  
  // Estado para los insumos dinámicos
  const [insumos, setInsumos] = useState([
    { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
    { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
    { nombre: "" }, { nombre: "" }
  ]);
  const [insumosVisibles, setInsumosVisibles] = useState(2);
  
  // Estado principal de la orden
  const [nuevaOrden, setNuevaOrden] = useState({
    // Datos de la Orden
    numeroOrden: "",
    fecha: "",
    esGarantia: false,
    // Fechas con checkbox
    fechaIngreso: "",
    fechaIngresoCheck: false,
    fechaTermino: "",
    fechaTerminoCheck: false,
    fechaEntrega: "",
    fechaEntregaCheck: false,
    fechaCompra: "",
    fechaCompraCheck: false,
    // Datos del Cliente
    cliente: "",
    direccion: "",
    comuna: "",
    rut: "",
    email: "",
    fonoPrincipal: "",
    contacto: "",
    fonoContacto: "",
    emailContacto: "",
    tecnicoAsignado: "",
    contactosExtra: [],
    direccionesExtra: [],
    // Datos del Equipo
    equipo: "",
    modelo: "",
    marca: "",
    serie: "",
    contadorPagOut: "",
    nivelTinta: "",
    // Avería/Falla/Incidencia
    averia: "",
    actividad: "",
    observaciones: "",
    infoInterna: "",
    adjuntos: []
  });

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
      
      // Solo procesar si hay datos de cliente u orden
      if (!navState || (!navState?.cliente && !navState?.orden)) return;
      
      const ordenFromNav = navState?.orden;
      const clienteFromNav = navState?.cliente;
      
      if (ordenFromNav) {
        // Cargar clientes frescos antes de editar la orden
        await fetchClientes();
        await fetchEquipos();
        editarOrden(ordenFromNav);
        window.history.replaceState({}, document.title);
      }
      
      if (clienteFromNav) {
        const fechaActual = new Date().toISOString().split("T")[0];
        const numeroOt = await calcularSiguienteNumeroOrden();
        setEditingId(null);
        setClienteSeleccionado(clienteFromNav);
        setClienteFijo(true);
        setClienteInactivo(false);
        setEquipoSeleccionado(null);
        setEquipoFijo(false);
        setBusquedaCliente((clienteFromNav.razon_social || "").toUpperCase());
    setBusquedaModelo("");
    setEquiposModeloSugeridos([]);
        setInsumos([
          { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
          { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
          { nombre: "" },           { nombre: "" }
        ]);
        setInsumosVisibles(2);
        setNuevaOrden({
          numeroOrden: numeroOt,
          fecha: fechaActual,
          esGarantia: false,
          fechaIngreso: "",
          fechaIngresoCheck: false,
          fechaTermino: "",
          fechaTerminoCheck: false,
          fechaEntrega: "",
          fechaEntregaCheck: false,
        fechaCompra: "",
        fechaCompraCheck: false,
        cliente: (clienteFromNav.razon_social || "").toUpperCase(),
        direccion: (clienteFromNav.direccion || "").toUpperCase(),
        comuna: (clienteFromNav.comuna || "").toUpperCase(),
        rut: clienteFromNav.rut || "",
        email: clienteFromNav.email || "",
        fonoPrincipal: clienteFromNav.telefono || "",
        contacto: (clienteFromNav.contacto_nombre || "").toUpperCase(),
        fonoContacto: clienteFromNav.contacto_fono || "",
        emailContacto: clienteFromNav.contacto_email || "",
        tecnicoAsignado: "",
        equipo: "",
        modelo: "",
        marca: "",
        serie: "",
        contadorPagOut: "",
        nivelTinta: "",
        averia: "",
        actividad: "",
        observaciones: "",
        infoInterna: "",
        adjuntos: [],
        contactosExtra: [],
        direccionesExtra: []
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
    setSoloLectura(false);
    setClienteSeleccionado(null);
    setClienteFijo(false);
    setEquipoSeleccionado(null);
    setEquipoFijo(false);
    setClienteInactivo(false);
    setBusquedaCliente("");
    setBusquedaModelo("");
    setEquiposModeloSugeridos([]);
    setInsumos([
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" },       { nombre: "" }
    ]);
    setInsumosVisibles(2);
    setMostrarFormulario(true);
  };

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

  const fetchOrdenes = async (signal) => {
    setLoading(true);
    try {
      const res = await getCached("/api/ordenes?page=1&limit=10000", { signal });
      setOrdenes(res.data.ordenes);
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar órdenes:", err);
    } finally {
      setLoading(false);
    }
  };

  const ordenesFiltradas = ordenes.filter(orden => {
    if (filtroNumeroOrden && !orden.numero_orden?.toLowerCase().includes(filtroNumeroOrden.toLowerCase())) return false;
    if (filtroCliente && !orden.cliente?.toLowerCase().includes(filtroCliente.toLowerCase())) return false;
    if (filtroSerie && !orden.serie?.toLowerCase().includes(filtroSerie.toLowerCase())) return false;
    if (filtroEstado === "cerrada" && !orden.fecha_entrega) return false;
    if (filtroEstado === "pendiente" && orden.fecha_entrega) return false;
    if (filtroGarantia === "si" && !orden.es_garantia) return false;
    if (filtroGarantia === "no" && orden.es_garantia) return false;
    if (filtroFechaDesde && orden.fecha && orden.fecha.substring(0, 10) < filtroFechaDesde) return false;
    if (filtroFechaHasta && orden.fecha && orden.fecha.substring(0, 10) > filtroFechaHasta) return false;
    return true;
  });

  const totalPaginas = Math.ceil(ordenesFiltradas.length / ITEMS_POR_PAG);
  const ordenesPag = ordenesFiltradas.slice((paginaActual - 1) * ITEMS_POR_PAG, paginaActual * ITEMS_POR_PAG);

  useClampPagina(paginaActual, setPaginaActual, totalPaginas);

  const fmtDate = (d) => {
    if (!d) return "";
    const dt = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dt.getTime())) return "";
    return dt.toISOString().split("T")[0];
  };

  const parseExtra = (val) => {
    try {
      const arr = JSON.parse(val || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  // Adjuntos: la columna guarda JSON array [{nombre, tipo, data}] o null.
  // Compatibilidad con datos viejos guardados como data URL suelto (v1.94 previa).
  const parseAdjuntos = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const arr = JSON.parse(val);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const editarOrden = async (orden) => {
    // El listado ya no trae "adjunto" (es pesado y no se muestra ahí): se pide
    // la orden completa recién al abrirla, para no perder el archivo al guardar.
    const res = await api.get(`/api/ordenes/${orden.id}`);
    orden = res.data;

    setEditingId(orden.id);
    setClienteFijo(false);
    setEquipoFijo(false);
    setEquipoSeleccionado(null);
    setMostrarFormulario(true);
    
    // Cargar datos de la orden en el formulario
    setNuevaOrden({
      numeroOrden: orden.numero_orden || "",
      fecha: fmtDate(orden.fecha),
      esGarantia: orden.es_garantia || false,
      fechaIngreso: fmtDate(orden.fecha_ingreso),
      fechaIngresoCheck: orden.fecha_ingreso_check || false,
      fechaTermino: fmtDate(orden.fecha_termino),
      fechaTerminoCheck: orden.fecha_termino_check || false,
      fechaEntrega: fmtDate(orden.fecha_entrega),
      fechaEntregaCheck: orden.fecha_entrega_check || false,
      fechaCompra: fmtDate(orden.fecha_compra),
      fechaCompraCheck: orden.fecha_compra_check || false,
      cliente: toUpper(orden.cliente),
      direccion: toUpper(orden.direccion),
      comuna: toUpper(orden.comuna),
      rut: orden.rut || "",
      email: orden.email || "",
      fonoPrincipal: orden.fono_principal || "",
      contacto: toUpper(orden.contacto),
      fonoContacto: orden.fono_contacto || "",
      emailContacto: orden.email_contacto || "",
      tecnicoAsignado: toUpper(orden.tecnico_asignado),
      equipo: toUpper(orden.equipo),
      modelo: toUpper(orden.modelo),
      marca: toUpper(orden.marca),
      serie: toUpper(orden.serie),
      contadorPagOut: orden.contador_pag_out || "",
      nivelTinta: toUpper(orden.nivel_tinta),
      averia: toUpper(orden.averia),
      actividad: toUpper(orden.actividad),
      observaciones: toUpper(orden.observaciones),
      infoInterna: toUpper(orden.info_interna),
      adjuntos: parseAdjuntos(orden.adjunto),
      contactosExtra: parseExtra(orden.contactos_extra),
      direccionesExtra: parseExtra(orden.direcciones_extra)
    });

    // Igual que con el cliente: si los datos del equipo coinciden con un registro
    // del mantenedor, se marca como seleccionado (badge ✓ y botón Editar disponibles)
    const normEqOT = (v) => String(v || "").trim().toUpperCase();
    if (orden.equipo && orden.marca && orden.modelo) {
      const eq = (equipos || []).find(e =>
        normEqOT(e.equipo) === normEqOT(orden.equipo) &&
        normEqOT(e.marca) === normEqOT(orden.marca) &&
        normEqOT(e.modelo) === normEqOT(orden.modelo)
      );
      setEquipoSeleccionado(eq || null);
    }

    // Buscar cliente asociado - solo para badge/estado, NO sobreescribir datos de la OT
    const cl = clientes.find(c => 
      (orden.cliente_id && c.id === orden.cliente_id) || 
      (orden.cliente && c.razon_social === orden.cliente)
    );
    if (cl) {
      setClienteSeleccionado(cl);
      setClienteInactivo(false);
      setBusquedaCliente((cl.razon_social || orden.cliente || "").toUpperCase());
    } else if (orden.cliente_id) {
      try {
        const resCli = await getCached(`/api/clientes`);
        const clFresco = resCli.data.find(c => c.id === orden.cliente_id);
        if (clFresco) {
          setClienteSeleccionado(clFresco);
          setClienteInactivo(false);
          setBusquedaCliente((clFresco.razon_social || orden.cliente || "").toUpperCase());
        } else {
          setClienteSeleccionado(null);
          setClienteInactivo(true);
          setBusquedaCliente((orden.cliente || "").toUpperCase());
        }
      } catch {
        setClienteSeleccionado(null);
        setClienteInactivo(true);
        setBusquedaCliente((orden.cliente || "").toUpperCase());
      }
    } else {
      setClienteSeleccionado(null);
      setClienteInactivo(!!orden.cliente_id);
      setBusquedaCliente((orden.cliente || "").toUpperCase());
    }

    // Cargar insumos
    const insumosData = [];
    for (let i = 1; i <= 12; i++) {
      const insumo = orden[`insumo${i}`];
      if (insumo) insumosData.push({ nombre: insumo });
    }
    const nuevosInsumos = [...insumosData];
    while (nuevosInsumos.length < 12) {
      nuevosInsumos.push({ nombre: "" });
    }
    setInsumos(nuevosInsumos);
    setInsumosVisibles(Math.max(2, insumosData.length));
  };

  const verOrden = async (orden) => {
    // Mismo motivo que en editarOrden: el listado no trae "adjunto".
    const res = await api.get(`/api/ordenes/${orden.id}`);
    orden = res.data;

    setSoloLectura(true);
    setClienteFijo(false);
    setEquipoFijo(false);
    setEquipoSeleccionado(null);
    setEditingId(null);
    setMostrarFormulario(true);
    
    setNuevaOrden({
      numeroOrden: orden.numero_orden || "",
      fecha: fmtDate(orden.fecha),
      esGarantia: orden.es_garantia || false,
      fechaIngreso: fmtDate(orden.fecha_ingreso),
      fechaIngresoCheck: orden.fecha_ingreso_check || false,
      fechaTermino: fmtDate(orden.fecha_termino),
      fechaTerminoCheck: orden.fecha_termino_check || false,
      fechaEntrega: fmtDate(orden.fecha_entrega),
      fechaEntregaCheck: orden.fecha_entrega_check || false,
      fechaCompra: fmtDate(orden.fecha_compra),
      fechaCompraCheck: orden.fecha_compra_check || false,
      cliente: toUpper(orden.cliente),
      direccion: toUpper(orden.direccion),
      comuna: toUpper(orden.comuna),
      rut: orden.rut || "",
      email: orden.email || "",
      fonoPrincipal: orden.fono_principal || "",
      contacto: toUpper(orden.contacto),
      fonoContacto: orden.fono_contacto || "",
      emailContacto: orden.email_contacto || "",
      tecnicoAsignado: toUpper(orden.tecnico_asignado),
      equipo: toUpper(orden.equipo),
      modelo: toUpper(orden.modelo),
      marca: toUpper(orden.marca),
      serie: toUpper(orden.serie),
      contadorPagOut: orden.contador_pag_out || "",
      nivelTinta: toUpper(orden.nivel_tinta),
      averia: toUpper(orden.averia),
      actividad: toUpper(orden.actividad),
      observaciones: toUpper(orden.observaciones),
      infoInterna: toUpper(orden.info_interna),
      adjuntos: parseAdjuntos(orden.adjunto),
      contactosExtra: parseExtra(orden.contactos_extra),
      direccionesExtra: parseExtra(orden.direcciones_extra)
    });

    // Igual que en edición: si el equipo coincide con un registro del mantenedor
    // se marca como seleccionado (habilita botones Ver/Editar)
    const normEqOT = (v) => String(v || "").trim().toUpperCase();
    if (orden.equipo && orden.marca && orden.modelo) {
      const eq = (equipos || []).find(e =>
        normEqOT(e.equipo) === normEqOT(orden.equipo) &&
        normEqOT(e.marca) === normEqOT(orden.marca) &&
        normEqOT(e.modelo) === normEqOT(orden.modelo)
      );
      setEquipoSeleccionado(eq || null);
    }

    const cl = clientes.find(c => 
      (orden.cliente_id && c.id === orden.cliente_id) || 
      (orden.cliente && c.razon_social === orden.cliente)
    );
    if (cl) {
      setClienteSeleccionado(cl);
      setClienteInactivo(false);
      setBusquedaCliente((cl.razon_social || orden.cliente || "").toUpperCase());
    } else if (orden.cliente_id) {
      try {
        const resCli = await getCached(`/api/clientes`);
        const clFresco = resCli.data.find(c => c.id === orden.cliente_id);
        if (clFresco) {
          setClienteSeleccionado(clFresco);
          setClienteInactivo(false);
          setBusquedaCliente((clFresco.razon_social || orden.cliente || "").toUpperCase());
        } else {
          setClienteSeleccionado(null);
          setClienteInactivo(true);
          setBusquedaCliente((orden.cliente || "").toUpperCase());
        }
      } catch {
        setClienteSeleccionado(null);
        setClienteInactivo(true);
        setBusquedaCliente((orden.cliente || "").toUpperCase());
      }
    } else {
      setClienteSeleccionado(null);
      setClienteInactivo(!!orden.cliente_id);
      setBusquedaCliente((orden.cliente || "").toUpperCase());
    }

    const insumosData = [];
    for (let i = 1; i <= 12; i++) {
      const insumo = orden[`insumo${i}`];
      if (insumo) insumosData.push({ nombre: insumo });
    }
    const nuevosInsumos = [...insumosData];
    while (nuevosInsumos.length < 12) {
      nuevosInsumos.push({ nombre: "" });
    }
    setInsumos(nuevosInsumos);
    setInsumosVisibles(Math.max(2, insumosData.length));
  };

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
  const seleccionarCliente = (cliente) => {
    const mismoCliente = clienteSeleccionado?.id === cliente.id;
    setClienteSeleccionado(cliente);
    setClienteInactivo(false);
    setBusquedaCliente(toUpper(cliente.razon_social));
    setMostrarDropdownClientes(false);

    // Mismo cliente re-seleccionado en modo edicion: solo re-sincroniza sus
    // datos propios con lo registrado (por si se editaron a mano en la OT),
    // sin tocar equipo, contacto ni direcciones/contactos extra.
    if (mismoCliente && editingId) {
      setNuevaOrden(prev => ({
        ...prev,
        cliente: toUpper(cliente.razon_social),
        direccion: toUpper(cliente.direccion),
        comuna: toUpper(cliente.comuna),
        rut: cliente.rut || "",
        email: cliente.email || "",
        fonoPrincipal: cliente.telefono || ""
      }));
      return;
    }

    // En modo edicion, solo actualizar datos del cliente sin limpiar equipo
    if (editingId) {
      setNuevaOrden(prev => ({
        ...prev,
        cliente: toUpper(cliente.razon_social),
        direccion: toUpper(cliente.direccion),
        comuna: toUpper(cliente.comuna),
        rut: cliente.rut || "",
        email: cliente.email || "",
        fonoPrincipal: cliente.telefono || "",
        contacto: "",
        fonoContacto: "",
        emailContacto: "",
        contactosExtra: [],
        direccionesExtra: []
      }));
      return;
    }

    setEquipoSeleccionado(null);
    setBusquedaModelo("");
    setNuevaOrden(prev => ({
      ...prev,
      cliente: toUpper(cliente.razon_social),
      direccion: toUpper(cliente.direccion),
      comuna: toUpper(cliente.comuna),
      rut: cliente.rut || "",
      email: cliente.email || "",
      fonoPrincipal: cliente.telefono || "",
      contacto: "",
      fonoContacto: "",
      emailContacto: "",
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
      observaciones: ""
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

  const guardarOrden = async (e, mantener = false) => {
    e.preventDefault();
    if (guardandoRef.current) return;

    // Cliente y RUT obligatorios y completos
    if (!nuevaOrden.cliente || !nuevaOrden.cliente.trim()) {
      alert("Complete el Cliente antes de guardar la orden.");
      return;
    }
    // RUT "19" = comodín (cliente sin RUT conocido): se permite sin validar formato
    const rutNormOT = normalizarRut(nuevaOrden.rut);
    if (rutNormOT !== "19" && (!nuevaOrden.rut || !nuevaOrden.rut.trim() || !validarRUT(nuevaOrden.rut))) {
      alert("Complete el RUT del cliente (con guion y dígito verificador) antes de guardar la orden.");
      return;
    }

    // Emails con formato válido: cliente, contacto y contactos adicionales
    const emailsOT = [
      ["Email", nuevaOrden.email],
      ["Email Contacto", nuevaOrden.emailContacto],
      ...(nuevaOrden.contactosExtra || []).map((c, i) => [`Email contacto ${i + 1}`, c.email]),
    ];
    for (const [campo, valor] of emailsOT) {
      if (String(valor || "").trim() && !validarEmail(valor)) {
        alert(`Email inválido (${campo}).`);
        return;
      }
    }

    // El cliente debe existir en el mantenedor de Clientes
    const normTxtOT = (s) => String(s || "").toUpperCase().trim();
    const clienteEncontrado =
      (clientes || []).find((c) => normTxtOT(c.razon_social) === normTxtOT(nuevaOrden.cliente)) ||
      (clientes || []).find((c) => rutNormOT && normalizarRut(c.rut) === rutNormOT) ||
      null;
    if (!clienteEncontrado) {
      alert(`El cliente no está registrado. Use "Registrar en Clientes".`);
      return;
    }

    // El cliente debe estar seleccionado explícitamente en el buscador para poder guardar
    if (!clienteSeleccionado) {
      alert("Seleccione un cliente del buscador antes de guardar.");
      return;
    }

    // El RUT escrito no puede pertenecer a otro cliente distinto del seleccionado
    // (el comodín "19" se excluye porque lo comparten varios clientes)
    if (rutNormOT && rutNormOT !== "19") {
      const duenoRut = (clientes || []).find((c) => normalizarRut(c.rut) === rutNormOT);
      if (duenoRut && duenoRut.id !== clienteSeleccionado.id) {
        alert(`El RUT ${nuevaOrden.rut} pertenece al cliente ${duenoRut.codigo || "CL-????"}.`);
        return;
      }
    }

    // Validar peso total de adjuntos: data URL base64 ≈ 33% más pesada que el archivo original
    const adjuntos = nuevaOrden.adjuntos || [];
    if (adjuntos.length > 0) {
      const bytesTotal = adjuntos.reduce((acc, a) => acc + (a.data?.length || 0), 0);
      const mbTotal = (bytesTotal * 0.75) / (1024 * 1024);
      if (mbTotal > 18) {
        alert(`Las imágenes adjuntas suman aproximadamente ${mbTotal.toFixed(1)} MB.\nEl límite es 20 MB. Reducí el tamaño de las imágenes o eliminá algunas antes de guardar.`);
        return;
      }
    }
    
    // Preparar insumos
    const ins = insumos.filter(i => i.nombre.trim() !== "").map(i => i.nombre);
    
    const payload = {
      ...nuevaOrden,
      clienteId: clienteSeleccionado?.id || null,
      equipoId: null, // Las OT no se vinculan a equipos: se copian los datos (mismo modelo puede tener otra serie)
      insumo1: ins[0] || "",
      insumo2: ins[1] || "",
      insumo3: ins[2] || "",
      insumo4: ins[3] || "",
      insumo5: ins[4] || "",
      insumo6: ins[5] || "",
      insumo7: ins[6] || "",
      insumo8: ins[7] || "",
      insumo9: ins[8] || "",
      insumo10: ins[9] || "",
      insumo11: ins[10] || "",
      insumo12: ins[11] || ""
    };
    
    guardandoRef.current = true;
    setGuardando(true);
    try {
      if (editingId) {
        await api.put(`/api/ordenes/${editingId}`, payload);
      } else {
        await api.post("/api/ordenes", payload);
      }
      
      if (mantener && editingId) {
        // "Guardar Cambios": guarda y se mantiene en la OT para seguir editando
        const res = await api.get(`/api/ordenes/${editingId}`);
        await editarOrden(res.data);
      } else {
        alert(editingId ? "Orden actualizada exitosamente" : "Orden guardada exitosamente");
        const navState = window.history.state?.usr;
        const vinoDeCliente = navState?.cliente || navState?.orden;
        setMostrarFormulario(false);
        resetFormulario();
        setSoloLectura(false);
        window.history.replaceState({}, document.title);
        if (vinoDeCliente) {
          navigate("/clientes");
        } else {
          // Una orden nueva queda primera (backend ordena por id DESC): saltar a la página 1 para verla.
          // Al editar se conserva la página en la que estaba el usuario.
          if (!editingId) setPaginaActual(1);
          fetchOrdenes();
        }
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
    setNuevaOrden({
      numeroOrden: "",
      fecha: "",
      esGarantia: false,
      fechaIngreso: "",
      fechaIngresoCheck: false,
      fechaTermino: "",
      fechaTerminoCheck: false,
      fechaEntrega: "",
      fechaEntregaCheck: false,
      fechaCompra: "",
      fechaCompraCheck: false,
      cliente: "",
      direccion: "",
      comuna: "",
      rut: "",
      email: "",
      fonoPrincipal: "",
      contacto: "",
      fonoContacto: "",
      emailContacto: "",
      tecnicoAsignado: "",
      equipo: "",
      modelo: "",
      marca: "",
      serie: "",
      contadorPagOut: "",
      nivelTinta: "",
      averia: "",
      actividad: "",
      observaciones: "",
      infoInterna: "",
      adjuntos: [],
      contactosExtra: [],
      direccionesExtra: []
    });
    setInsumos([
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" },       { nombre: "" }
    ]);
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
                <button type="button" className="of-head-close" onClick={cerrarFormulario}><X size={18} /></button>
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
                    <div className="of-st muted">Observaciones</div>
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
                {!soloLectura && editingId && (
                  <button type="button" className="of-btn-s" onClick={(e) => guardarOrden(e, true)} disabled={guardando}>
                    <Save size={16} /> {guardando ? "Guardando..." : "Guardar Cambios"}
                  </button>
                )}
                {!soloLectura && (
                  <button type="submit" className="of-btn-p" disabled={guardando}>
                    <Save size={16} /> {guardando ? "Guardando..." : (editingId ? "Cerrar" : "Guardar Orden")}
                  </button>
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