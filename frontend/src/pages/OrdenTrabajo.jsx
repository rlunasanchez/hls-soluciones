import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Users, Package, FileText, FileSpreadsheet, ShoppingCart, UserCog,
  Save, X, Wrench
} from "lucide-react";
import api from "../services/api";
import { toUpper, cerrarSesion, upperInput } from "../utils/helpers";
import '../styles/OrdenTrabajo.css';
import "../styles/ordenes-componentes.css";
import HeaderOrdenTrabajo from "../components/ordenes/HeaderOrdenTrabajo";
import OrdenLista from "../components/ordenes/OrdenLista";
import OrdenFormDatos from "../components/ordenes/OrdenFormDatos";
import OrdenFormCliente from "../components/ordenes/OrdenFormCliente";
import OrdenFormEquipo from "../components/ordenes/OrdenFormEquipo";
import OrdenFormInsumos from "../components/ordenes/OrdenFormInsumos";
import OrdenFormAveria from "../components/ordenes/OrdenFormAveria";


function OrdenTrabajo() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estados para listar órdenes con paginación
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
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
  
  // Estados para autocompletar clientes y equipos
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteFijo, setClienteFijo] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [equipoFijo, setEquipoFijo] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaSerie, setBusquedaSerie] = useState("");
  const [busquedaModelo, setBusquedaModelo] = useState("");
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [mostrarDropdownEquipos, setMostrarDropdownEquipos] = useState(false);
  const [mostrarDropdownModelo, setMostrarDropdownModelo] = useState(false);
  const [equiposSugeridos, setEquiposSugeridos] = useState([]);
  const [equiposModeloSugeridos, setEquiposModeloSugeridos] = useState([]);
  const [clienteInactivo, setClienteInactivo] = useState(false);
  const [soloLectura, setSoloLectura] = useState(false);
  
  // Refs para detectar clics fuera de los dropdowns
  const equipoDropdownRef = useRef(null);
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
        setBusquedaSerie("");
    setBusquedaModelo("");
    setEquiposSugeridos([]);
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
    setBusquedaSerie("");
    setBusquedaModelo("");
    setEquiposSugeridos([]);
    setEquiposModeloSugeridos([]);
    setInsumos([
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" },       { nombre: "" }
    ]);
    setInsumosVisibles(2);
    setMostrarFormulario(true);
  };

  // Resetear paginación al filtrar
  useEffect(() => { setPaginaActual(1); }, [filtroNumeroOrden, filtroCliente, filtroSerie, filtroEstado, filtroGarantia, filtroFechaDesde, filtroFechaHasta]);

  // Buscar equipos por serie via API (datos siempre frescos)
  useEffect(() => {
    if (busquedaSerie.length < 2) { setEquiposSugeridos([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/equipos?q=${encodeURIComponent(busquedaSerie)}`);
        setEquiposSugeridos(res.data);
      } catch { setEquiposSugeridos([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaSerie]);

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
      if (equipoDropdownRef.current && !equipoDropdownRef.current.contains(event.target)) {
        setMostrarDropdownEquipos(false);
      }
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
      const res = await api.get("/api/ordenes?page=1&limit=10000", { signal });
      setOrdenes(res.data.ordenes);
      setPaginaActual(1);
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

    // Las OT no se vinculan a equipos: los datos ya vienen del snapshot de la OT
    // (sin badge de vinculación ni equipoSeleccionado)

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
        const resCli = await api.get(`/api/clientes`);
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

    // Las OT no se vinculan a equipos: los datos ya vienen del snapshot de la OT
    // (sin badge de vinculación ni equipoSeleccionado), igual que en edición

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
        const resCli = await api.get(`/api/clientes`);
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
      const res = await api.get("/api/clientes", { signal });
      setClientes(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar clientes:", err);
    }
  };

  const fetchEquipos = async (signal) => {
    try {
      const res = await api.get("/api/equipos", { signal });
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
    if (mismoCliente && editingId) return;

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
        contacto: toUpper(cliente.contacto_nombre),
        fonoContacto: cliente.contacto_fono || "",
        emailContacto: cliente.contacto_email || "",
        contactosExtra: [],
        direccionesExtra: []
      }));
      return;
    }

    setEquipoSeleccionado(null);
    setBusquedaSerie("");
    setBusquedaModelo("");
    setNuevaOrden(prev => ({
      ...prev,
      cliente: toUpper(cliente.razon_social),
      direccion: toUpper(cliente.direccion),
      comuna: toUpper(cliente.comuna),
      email: cliente.email || "",
      fonoPrincipal: cliente.telefono || "",
      contacto: toUpper(cliente.contacto_nombre),
      fonoContacto: cliente.contacto_fono || "",
      emailContacto: cliente.contacto_email || "",
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

  // Seleccionar equipo por serie - NO vincula equipo ni carga avería (solo los datos de esa serie)
  const seleccionarEquipo = (equipo) => {
    setNuevaOrden(prev => ({
      ...prev,
      equipo: toUpper(equipo.equipo),
      modelo: toUpper(equipo.modelo),
      marca: toUpper(equipo.marca),
      serie: toUpper(equipo.serie)
      // NOTA: No vincula equipo (equipoId = null), solo trae los datos de la serie
    }));

     setBusquedaSerie((equipo.serie || "").toUpperCase());
     setBusquedaModelo((equipo.modelo || "").toUpperCase());
     setMostrarDropdownEquipos(false);
     setMostrarDropdownModelo(false);
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

     setBusquedaSerie("");
     setBusquedaModelo((equipo.modelo || "").toUpperCase());
     setMostrarDropdownEquipos(false);
     setMostrarDropdownModelo(false);
  };

  // Filtrar clientes para la búsqueda (local)
  const clientesFiltrados = busquedaCliente.length >= 2 ? clientes.filter(c => 
    c.razon_social?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.rut?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.codigo?.toLowerCase().includes(busquedaCliente.toLowerCase())
  ).slice(0, 10) : [];

  // Equipos filtrados por API (siempre frescos)
  const equiposFiltrados = equiposSugeridos;
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

    // RUT único: si se escribe un RUT que ya existe para otro cliente del mantenedor → alerta
    if (nuevaOrden.rut && nuevaOrden.rut.trim()) {
      const rutNormalizado = nuevaOrden.rut.replace(/[.\s]/g, "").toUpperCase();
      const existeRut = (clientes || []).some((c) => {
        if (clienteSeleccionado && c.id === clienteSeleccionado.id) return false;
        return (c.rut || "").replace(/[.\s]/g, "").toUpperCase() === rutNormalizado;
      });
      if (existeRut) {
        alert(`El RUT ${nuevaOrden.rut} ya existe para otro cliente.`);
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
    setBusquedaSerie("");
    setBusquedaModelo("");
    setEquiposSugeridos([]);
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
            <form onSubmit={guardarOrden} className="of-form">
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
                  busquedaSerie={busquedaSerie}
                  setBusquedaSerie={setBusquedaSerie}
                  mostrarDropdownEquipos={mostrarDropdownEquipos}
                  setMostrarDropdownEquipos={setMostrarDropdownEquipos}
                  equiposFiltrados={equiposFiltrados}
                  equipoDropdownRef={equipoDropdownRef}
                  seleccionarEquipo={seleccionarEquipo}
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
    </div>
  );
}

export default OrdenTrabajo;