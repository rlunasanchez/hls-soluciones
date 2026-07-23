import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Users, Package, FileText, FileSpreadsheet, ShoppingCart, UserCog,
  Save, X, Wrench
} from "lucide-react";
import api from "../services/api";
import { toUpper, cerrarSesion } from "../utils/helpers";
import './OrdenTrabajo.css';
import "../components/ordenes/ordenes-componentes.css";
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
  const [errorNumeroOrden, setErrorNumeroOrden] = useState("");
  
  // Estados para listar órdenes con paginación
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAG = 4;
  const [editingId, setEditingId] = useState(null);
  const [filtroNumeroOrden, setFiltroNumeroOrden] = useState("");
  const [filtroGarantia, setFiltroGarantia] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [fromClientes, setFromClientes] = useState(false);
  
  // Estados para autocompletar clientes y equipos
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaSerie, setBusquedaSerie] = useState("");
  const [busquedaCodigo, setBusquedaCodigo] = useState("");
  const [busquedaModelo, setBusquedaModelo] = useState("");
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [mostrarDropdownEquipos, setMostrarDropdownEquipos] = useState(false);
  const [mostrarDropdownCodigo, setMostrarDropdownCodigo] = useState(false);
  const [mostrarDropdownModelo, setMostrarDropdownModelo] = useState(false);
  const [equiposSugeridos, setEquiposSugeridos] = useState([]);
  const [equiposCodigoSugeridos, setEquiposCodigoSugeridos] = useState([]);
  const [equiposModeloSugeridos, setEquiposModeloSugeridos] = useState([]);
  const [clienteInactivo, setClienteInactivo] = useState(false);
  const [equipoOtroCliente, setEquipoOtroCliente] = useState(false);
  const [equipoNoExiste, setEquipoNoExiste] = useState(false);
  const [soloLectura, setSoloLectura] = useState(false);
  
  // Refs para detectar clics fuera de los dropdowns
  const equipoDropdownRef = useRef(null);
  const equipoCodigoDropdownRef = useRef(null);
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
    contacto: "",
    fonoPrincipal: "",
    tecnicoAsignado: "",
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
    observaciones: ""
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
        // Editar orden existente - llamar a editarOrden
        editarOrden(ordenFromNav);
      }
      
      if (clienteFromNav) {
        const fechaActual = new Date().toISOString().split("T")[0];
        const numeroOt = await calcularSiguienteNumeroOrden();
        setEditingId(null);
        setFromClientes(true);
        setClienteSeleccionado(clienteFromNav);
        setClienteInactivo(false);
        setEquipoOtroCliente(false);
        setEquipoNoExiste(false);
        setEquipoSeleccionado(null);
        setBusquedaCliente((clienteFromNav.razon_social || "").toUpperCase());
        setBusquedaSerie("");
    setBusquedaCodigo("");
    setBusquedaModelo("");
    setEquiposSugeridos([]);
    setEquiposCodigoSugeridos([]);
    setEquiposModeloSugeridos([]);
        setInsumos([
          { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
          { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
          { nombre: "" }, { nombre: "" }
        ]);
        setInsumosVisibles(2);
        setErrorNumeroOrden("");
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
        contacto: (clienteFromNav.contacto_nombre || "").toUpperCase(),
        fonoPrincipal: clienteFromNav.telefono || clienteFromNav.contacto_fono || "",
        tecnicoAsignado: "",
        equipo: "",
        modelo: "",
        marca: "",
        serie: "",
        contadorPagOut: "",
        nivelTinta: "",
        averia: "",
        actividad: "",
        observaciones: ""
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
    setFromClientes(false);
    setClienteSeleccionado(null);
    setEquipoSeleccionado(null);
    setClienteInactivo(false);
    setEquipoOtroCliente(false);
    setEquipoNoExiste(false);
    setBusquedaCliente("");
    setBusquedaSerie("");
    setBusquedaCodigo("");
    setBusquedaModelo("");
    setEquiposSugeridos([]);
    setEquiposCodigoSugeridos([]);
    setEquiposModeloSugeridos([]);
    setInsumos([
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" }, { nombre: "" }
    ]);
    setInsumosVisibles(2);
    setErrorNumeroOrden("");
    setMostrarFormulario(true);
  };

  // Resetear paginación al filtrar
  useEffect(() => { setPaginaActual(1); }, [filtroNumeroOrden, filtroGarantia, filtroEstado, filtroFechaDesde, filtroFechaHasta]);

  // Buscar equipos por código via API (datos siempre frescos)
  useEffect(() => {
    if (busquedaCodigo.length < 2) { setEquiposCodigoSugeridos([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/equipos?q=${encodeURIComponent(busquedaCodigo)}`);
        setEquiposCodigoSugeridos(res.data);
      } catch { setEquiposCodigoSugeridos([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaCodigo]);

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
      if (equipoCodigoDropdownRef.current && !equipoCodigoDropdownRef.current.contains(event.target)) {
        setMostrarDropdownCodigo(false);
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
    if (filtroGarantia === "si" && !orden.es_garantia) return false;
    if (filtroGarantia === "no" && orden.es_garantia) return false;
    if (filtroEstado === "cerrada" && !orden.fecha_entrega) return false;
    if (filtroEstado === "pendiente" && orden.fecha_entrega) return false;
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

  const editarOrden = async (orden) => {
    setEditingId(orden.id);
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
      contacto: toUpper(orden.contacto),
      fonoPrincipal: orden.fono_principal || "",
      tecnicoAsignado: toUpper(orden.tecnico_asignado),
      equipo: toUpper(orden.equipo),
      modelo: toUpper(orden.modelo),
      marca: toUpper(orden.marca),
      serie: toUpper(orden.serie),
      contadorPagOut: orden.contador_pag_out || "",
      nivelTinta: toUpper(orden.nivel_tinta),
      averia: toUpper(orden.averia),
      actividad: toUpper(orden.actividad),
      observaciones: toUpper(orden.observaciones)
    });

    // Buscar equipo asociado - primero intentar con datos frescos del API
    setEquipoNoExiste(false);
    const cargarEquipoFresco = async () => {
      try {
        if (orden.equipo_id) {
          const res = await api.get(`/api/equipos/${orden.equipo_id}`);
          const eq = res.data;
          setEquipoSeleccionado(eq);
          setEquipoOtroCliente(orden.cliente_id && eq.cliente_id && eq.cliente_id !== orden.cliente_id);
          setEquipoNoExiste(false);
          setBusquedaCodigo(eq.codigo || "");
          setBusquedaSerie((eq.serie || "").toUpperCase());
          setBusquedaModelo((eq.modelo || "").toUpperCase());
          setNuevaOrden(prev => ({
            ...prev,
            equipo: toUpper(eq.equipo) || prev.equipo,
            modelo: toUpper(eq.modelo) || prev.modelo,
            marca: toUpper(eq.marca) || prev.marca,
            serie: toUpper(eq.serie) || prev.serie,
            contadorPagOut: eq.contador_pag?.toString() || prev.contadorPagOut,
            nivelTinta: toUpper(eq.nivel_tintas) || prev.nivelTinta,
            averia: toUpper(eq.averia) || prev.averia
          }));
          const insumosEquipo = [];
          for (let i = 1; i <= 12; i++) {
            const insumo = eq[`insumo${i}`];
            if (insumo) insumosEquipo.push({ nombre: insumo.toUpperCase() });
          }
          if (insumosEquipo.length > 0) {
            const nuevosInsumos = [...insumosEquipo];
            while (nuevosInsumos.length < 12) {
              nuevosInsumos.push({ nombre: "" });
            }
            setInsumos(nuevosInsumos);
            setInsumosVisibles(Math.max(2, insumosEquipo.length));
          }
          return;
        }
      } catch (err) {
        console.error("Error al cargar equipo fresco:", err);
        setEquipoNoExiste(true);
      }
      // Fallback: buscar en la lista local
      const eq = equipos.find(e => 
        (orden.equipo_id && e.id === orden.equipo_id) || 
        (orden.serie && e.serie === orden.serie)
      );
      if (eq) {
        setEquipoSeleccionado(eq);
        setEquipoOtroCliente(orden.cliente_id && eq.cliente_id && eq.cliente_id !== orden.cliente_id);
        setEquipoNoExiste(false);
        setBusquedaCodigo(eq.codigo || "");
        setBusquedaSerie((eq.serie || "").toUpperCase());
        setBusquedaModelo((eq.modelo || "").toUpperCase());
      } else if (orden.equipo_id) {
        setEquipoNoExiste(true);
      }
    };
    cargarEquipoFresco();

    // Buscar cliente asociado en la lista cargada
    const cl = clientes.find(c => 
      (orden.cliente_id && c.id === orden.cliente_id) || 
      (orden.cliente && c.razon_social === orden.cliente)
    );
    if (cl) {
      setClienteSeleccionado(cl);
      setClienteInactivo(false);
      setBusquedaCliente((cl.razon_social || orden.cliente || "").toUpperCase());
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
      contacto: toUpper(orden.contacto),
      fonoPrincipal: orden.fono_principal || "",
      tecnicoAsignado: toUpper(orden.tecnico_asignado),
      equipo: toUpper(orden.equipo),
      modelo: toUpper(orden.modelo),
      marca: toUpper(orden.marca),
      serie: toUpper(orden.serie),
      contadorPagOut: orden.contador_pag_out || "",
      nivelTinta: toUpper(orden.nivel_tinta),
      averia: toUpper(orden.averia),
      actividad: toUpper(orden.actividad),
      observaciones: toUpper(orden.observaciones)
    });

    setEquipoNoExiste(false);
    const cargarEquipoFresco = async () => {
      try {
        if (orden.equipo_id) {
          const res = await api.get(`/api/equipos/${orden.equipo_id}`);
          const eq = res.data;
          setEquipoSeleccionado(eq);
          setEquipoOtroCliente(orden.cliente_id && eq.cliente_id && eq.cliente_id !== orden.cliente_id);
          setEquipoNoExiste(false);
          setBusquedaCodigo(eq.codigo || "");
          setBusquedaSerie((eq.serie || "").toUpperCase());
          setBusquedaModelo((eq.modelo || "").toUpperCase());
          setNuevaOrden(prev => ({
            ...prev,
            equipo: toUpper(eq.equipo) || prev.equipo,
            modelo: toUpper(eq.modelo) || prev.modelo,
            marca: toUpper(eq.marca) || prev.marca,
            serie: toUpper(eq.serie) || prev.serie,
            contadorPagOut: eq.contador_pag?.toString() || prev.contadorPagOut,
            nivelTinta: toUpper(eq.nivel_tintas) || prev.nivelTinta,
            averia: toUpper(eq.averia) || prev.averia
          }));
          const insumosEquipo = [];
          for (let i = 1; i <= 12; i++) {
            const insumo = eq[`insumo${i}`];
            if (insumo) insumosEquipo.push({ nombre: insumo.toUpperCase() });
          }
          if (insumosEquipo.length > 0) {
            const nuevosInsumos = [...insumosEquipo];
            while (nuevosInsumos.length < 12) {
              nuevosInsumos.push({ nombre: "" });
            }
            setInsumos(nuevosInsumos);
            setInsumosVisibles(Math.max(2, insumosEquipo.length));
          }
          return;
        }
      } catch (err) {
        console.error("Error al cargar equipo fresco:", err);
        setEquipoNoExiste(true);
      }
      const eq = equipos.find(e => 
        (orden.equipo_id && e.id === orden.equipo_id) || 
        (orden.serie && e.serie === orden.serie)
      );
      if (eq) {
        setEquipoSeleccionado(eq);
        setEquipoOtroCliente(orden.cliente_id && eq.cliente_id && eq.cliente_id !== orden.cliente_id);
        setEquipoNoExiste(false);
        setBusquedaCodigo(eq.codigo || "");
        setBusquedaSerie((eq.serie || "").toUpperCase());
        setBusquedaModelo((eq.modelo || "").toUpperCase());
      } else if (orden.equipo_id) {
        setEquipoNoExiste(true);
      }
    };
    cargarEquipoFresco();

    const cl = clientes.find(c => 
      (orden.cliente_id && c.id === orden.cliente_id) || 
      (orden.cliente && c.razon_social === orden.cliente)
    );
    if (cl) {
      setClienteSeleccionado(cl);
      setClienteInactivo(false);
      setBusquedaCliente((cl.razon_social || orden.cliente || "").toUpperCase());
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
    setClienteSeleccionado(cliente);
    setClienteInactivo(false);
    setEquipoSeleccionado(null);
    setEquipoOtroCliente(false);
    setEquipoNoExiste(false);
    setBusquedaCodigo("");
    setBusquedaSerie("");
    setBusquedaModelo("");
    setNuevaOrden(prev => ({
      ...prev,
      cliente: toUpper(cliente.razon_social),
      direccion: toUpper(cliente.direccion),
      comuna: toUpper(cliente.comuna),
      contacto: toUpper(cliente.contacto_nombre),
      fonoPrincipal: cliente.telefono || cliente.contacto_fono || "",
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
    setBusquedaCliente(toUpper(cliente.razon_social));
    setMostrarDropdownClientes(false);
  };

  // Seleccionar equipo por serie - NO carga avería (puede haber duplicados)
  const seleccionarEquipo = (equipo) => {
    setEquipoSeleccionado(equipo);
    setEquipoOtroCliente(clienteSeleccionado?.id && equipo.cliente_id && equipo.cliente_id !== clienteSeleccionado.id);
    setEquipoNoExiste(false);
    setNuevaOrden(prev => ({
      ...prev,
      equipo: toUpper(equipo.equipo),
      modelo: toUpper(equipo.modelo),
      marca: toUpper(equipo.marca),
      serie: toUpper(equipo.serie),
      contadorPagOut: equipo.contador_pag?.toString() || "",
      nivelTinta: toUpper(equipo.nivel_tintas)
      // NOTA: No carga avería aquí, solo al buscar por código
    }));
    
    // Cargar insumos del equipo
    const insumosEquipo = [];
    for (let i = 1; i <= 12; i++) {
      const insumo = equipo[`insumo${i}`];
      if (insumo) insumosEquipo.push({ nombre: insumo.toUpperCase() });
    }
    
    const nuevosInsumos = [...insumosEquipo];
    while (nuevosInsumos.length < 12) {
      nuevosInsumos.push({ nombre: "" });
    }
    setInsumos(nuevosInsumos);
    setInsumosVisibles(Math.max(2, insumosEquipo.length));
    
     setBusquedaSerie((equipo.serie || "").toUpperCase());
     setBusquedaModelo((equipo.modelo || "").toUpperCase());
     setMostrarDropdownEquipos(false);
     setMostrarDropdownModelo(false);
  };

  const seleccionarEquipoPorCodigo = async (codigo) => {
    try {
      const res = await api.get(`/api/equipos?q=${encodeURIComponent(codigo)}`);
      const eq = res.data[0];
      if (!eq) return;
      setEquipoSeleccionado(eq);
      setEquipoOtroCliente(clienteSeleccionado?.id && eq.cliente_id && eq.cliente_id !== clienteSeleccionado.id);
      setEquipoNoExiste(false);
      setMostrarDropdownCodigo(false);
      setNuevaOrden(prev => ({
        ...prev,
        equipo: toUpper(eq.equipo),
        modelo: toUpper(eq.modelo),
        marca: toUpper(eq.marca),
        serie: toUpper(eq.serie),
        contadorPagOut: eq.contador_pag?.toString() || "",
        nivelTinta: toUpper(eq.nivel_tintas),
        averia: toUpper(eq.averia)
      }));
      const insumosEquipo = [];
      for (let i = 1; i <= 12; i++) {
        const insumo = eq[`insumo${i}`];
        if (insumo) insumosEquipo.push({ nombre: insumo.toUpperCase() });
      }
      const nuevosInsumos = [...insumosEquipo];
      while (nuevosInsumos.length < 12) {
        nuevosInsumos.push({ nombre: "" });
      }
      setInsumos(nuevosInsumos);
      setInsumosVisibles(Math.max(2, insumosEquipo.length));
      setBusquedaSerie((eq.serie || "").toUpperCase());
      setBusquedaCodigo(codigo);
      setBusquedaModelo((eq.modelo || "").toUpperCase());

      // Si el equipo tiene cliente asociado, buscarlo en los datos locales
      if (eq.cliente_id) {
        const cliente = clientes.find(c => c.id === eq.cliente_id);
        if (cliente) {
          setClienteSeleccionado(cliente);
          setBusquedaCliente(toUpper(cliente.razon_social));
          setNuevaOrden(prev => ({
            ...prev,
            cliente: toUpper(cliente.razon_social),
            direccion: toUpper(cliente.direccion),
            comuna: toUpper(cliente.comuna),
            contacto: toUpper(cliente.contacto_nombre),
            fonoPrincipal: cliente.telefono || cliente.contacto_fono || ""
          }));
        }
      }
    } catch (err) {
      console.error("Error al buscar por código:", err);
    }
  };

  // Filtrar clientes para la búsqueda (local)
  const clientesFiltrados = busquedaCliente.length >= 2 ? clientes.filter(c => 
    c.razon_social?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.rut?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.codigo?.toLowerCase().includes(busquedaCliente.toLowerCase())
  ).slice(0, 10) : [];

  // Equipos filtrados por API (siempre frescos)
  const equiposFiltrados = equiposSugeridos;
  const equiposCodigoFiltrados = equiposCodigoSugeridos;
  const equiposModeloFiltrados = equiposModeloSugeridos;

  // Verificar número de orden único
  const verificarNumeroOrden = async (numero) => {
    if (!numero) return;
    try {
      const res = await api.get(editingId
        ? `/api/ordenes/verificar/${numero}?excluir=${editingId}`
        : `/api/ordenes/verificar/${numero}`
      );
      if (res.data.existe) {
        setErrorNumeroOrden("Este número de orden ya existe");
      } else {
        setErrorNumeroOrden("");
      }
    } catch (err) {
      console.error("Error al verificar número de orden:", err);
    }
  };

  const guardarOrden = async (e) => {
    e.preventDefault();
    
    if (errorNumeroOrden) {
      alert("Por favor corrija el número de orden antes de guardar");
      return;
    }
    
    // Preparar insumos
    const ins = insumos.filter(i => i.nombre.trim() !== "").map(i => i.nombre);
    
    const payload = {
      ...nuevaOrden,
      clienteId: clienteSeleccionado?.id || null,
      equipoId: equipoSeleccionado?.id || null,
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
    
    try {
      if (editingId) {
        await api.put(`/api/ordenes/${editingId}`, payload);
      } else {
        await api.post("/api/ordenes", payload);
      }
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
    } catch (err) {
      console.error("Error al guardar orden:", err);
      alert("Error al guardar la orden");
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
      contacto: "",
      fonoPrincipal: "",
      tecnicoAsignado: "",
      equipo: "",
      modelo: "",
      marca: "",
      serie: "",
      contadorPagOut: "",
      nivelTinta: "",
      averia: "",
      actividad: "",
      observaciones: ""
    });
    setInsumos([
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" }, { nombre: "" }
    ]);
    setInsumosVisibles(2);
    setClienteSeleccionado(null);
    setEquipoSeleccionado(null);
    setBusquedaCliente("");
    setBusquedaSerie("");
    setBusquedaCodigo("");
    setBusquedaModelo("");
    setEquiposSugeridos([]);
    setEquiposCodigoSugeridos([]);
    setEquiposModeloSugeridos([]);
    setMostrarDropdownModelo(false);
    setClienteInactivo(false);
    setEquipoOtroCliente(false);
    setEditingId(null);
    setErrorNumeroOrden("");
  };
  // Funciones de navegación eliminadas (accesos desde el menú)

  const navItems = [
    { label: "Inicio", icon: Home, onClick: () => navigate("/home"), color: "var(--primary)" },
    { label: "Clientes", icon: Users, onClick: () => navigate("/clientes"), color: "var(--warning)" },
    { label: "Equipos", icon: Package, onClick: () => navigate("/equipos"), color: "var(--success)" },
    { label: "Informes Técnicos", icon: FileText, onClick: () => navigate("/informes"), color: "#EA580C" },
    { label: "Cotizaciones", icon: FileSpreadsheet, onClick: () => navigate("/cotizaciones"), color: "#DB2777" },
    { label: "Orden de Compra", icon: ShoppingCart, onClick: () => navigate("/orden-compra"), color: "#8B5CF6" },
    { label: "Usuarios", icon: UserCog, onClick: () => navigate("/usuarios"), color: "#0D9488" },
  ];

  return (
    <div className="container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <HeaderOrdenTrabajo navItems={navItems} onLogout={cerrarSesion} />

      {!mostrarFormulario ? (
          <OrdenLista
            ordenes={ordenesPag}
            loading={loading}
            filtroNumeroOrden={filtroNumeroOrden}
            onFiltroChange={setFiltroNumeroOrden}
            filtroGarantia={filtroGarantia}
            onFiltroGarantiaChange={setFiltroGarantia}
            filtroEstado={filtroEstado}
            onFiltroEstadoChange={setFiltroEstado}
            filtroFechaDesde={filtroFechaDesde}
            onFiltroFechaDesdeChange={setFiltroFechaDesde}
            filtroFechaHasta={filtroFechaHasta}
            onFiltroFechaHastaChange={setFiltroFechaHasta}
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
        ) : (
          /* Formulario para crear orden */
          <>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '12px' }}>
            <div className="of-wrap">
              <div className="of-head">
                <h2><Wrench size={20} /> {soloLectura ? "Ver Orden" : editingId ? "Editar Orden" : "Nueva Orden"}</h2>
                <button type="button" className="of-head-close" onClick={() => { 
      const navState = window.history.state?.usr;
      const vinoDeCliente = navState?.cliente || navState?.orden;
      setMostrarFormulario(false); 
      resetFormulario(); 
      setEditingId(null);
      setSoloLectura(false);
      window.history.replaceState({}, document.title); 
      if (vinoDeCliente) navigate("/clientes");
    }}><X size={18} /></button>
              </div>
            <form onSubmit={guardarOrden} className="of-form">
              <OrdenFormDatos
                nuevaOrden={nuevaOrden}
                setNuevaOrden={setNuevaOrden}
                errorNumeroOrden={errorNumeroOrden}
                verificarNumeroOrden={verificarNumeroOrden}
                readOnly={soloLectura}
              />

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
                esEdicion={!!editingId}
                fetchClientes={fetchClientes}
                fromClientes={fromClientes}
                clienteInactivo={clienteInactivo}
                readOnly={soloLectura}
              />

              <OrdenFormEquipo
                busquedaCodigo={busquedaCodigo}
                setBusquedaCodigo={setBusquedaCodigo}
                mostrarDropdownCodigo={mostrarDropdownCodigo}
                setMostrarDropdownCodigo={setMostrarDropdownCodigo}
                equiposCodigoFiltrados={equiposCodigoFiltrados}
                equipoCodigoDropdownRef={equipoCodigoDropdownRef}
                seleccionarEquipoPorCodigo={seleccionarEquipoPorCodigo}
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
                equipoSeleccionado={equipoSeleccionado}
                nuevaOrden={nuevaOrden}
                setNuevaOrden={setNuevaOrden}
                fetchEquipos={fetchEquipos}
                clienteSeleccionado={clienteSeleccionado}
                fromClientes={fromClientes}
                esEdicion={!!editingId}
                equipoOtroCliente={equipoOtroCliente}
                equipoNoExiste={equipoNoExiste}
                readOnly={soloLectura}
              >
                <OrdenFormInsumos
                  insumos={insumos}
                  insumosVisibles={insumosVisibles}
                  setInsumosVisibles={setInsumosVisibles}
                  setInsumos={setInsumos}
                  readOnly={soloLectura}
                />
              </OrdenFormEquipo>

              <OrdenFormAveria
                nuevaOrden={nuevaOrden}
                setNuevaOrden={setNuevaOrden}
                readOnly={soloLectura}
              />

              {/* Botones de acción del formulario */}
              <div className="of-sub">
                <button type="button" className="of-btn-c" onClick={() => { 
      const navState = window.history.state?.usr;
      const vinoDeCliente = navState?.cliente || navState?.orden;
      setMostrarFormulario(false); 
      resetFormulario(); 
      setEditingId(null);
      setSoloLectura(false);
      window.history.replaceState({}, document.title); 
      if (vinoDeCliente) navigate("/clientes");
    }}>
                  <X size={16} /> {soloLectura ? "Cerrar" : "Cancelar"}
                </button>
                {!soloLectura && (
                  <button type="submit" className="of-btn-p">
                    <Save size={16} /> {editingId ? "Guardar Cambios" : "Guardar Orden"}
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