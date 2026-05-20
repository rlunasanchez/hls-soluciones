import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home, Users, Package, FileText, FileSpreadsheet, ShoppingCart, UserCog, LogOut,
  ClipboardList, Plus, Save, X, Wrench,
  Calendar, Phone, MapPin, User, AlertCircle, CheckSquare,
  Search, ChevronDown, Trash2, Edit
} from "lucide-react";
import api from "../services/api";
import './OrdenTrabajo.css';
import "../components/ordenes/ordenes-componentes.css";
import HeaderOrdenTrabajo from "../components/ordenes/HeaderOrdenTrabajo";
import OrdenLista from "../components/ordenes/OrdenLista";

function OrdenTrabajo() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [errorNumeroOrden, setErrorNumeroOrden] = useState("");
  
  // Estados para listar órdenes con paginación
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage:1,
    totalPages:1,
    totalItems:0,
    itemsPerPage:10
  });
  const [editingId, setEditingId] = useState(null);
  const [filtroNumeroOrden, setFiltroNumeroOrden] = useState("");
  
  // Estados para autocompletar clientes y equipos
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaSerie, setBusquedaSerie] = useState("");
  const [busquedaCodigo, setBusquedaCodigo] = useState("");
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [mostrarDropdownEquipos, setMostrarDropdownEquipos] = useState(false);
  const [mostrarDropdownCodigo, setMostrarDropdownCodigo] = useState(false);
  const [equiposCodigo, setEquiposCodigo] = useState([]);
  
  // Refs para detectar clics fuera de los dropdowns
  const equipoDropdownRef = useRef(null);
  const equipoCodigoDropdownRef = useRef(null);
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
    averia: ""
  });

  // Cargar clientes, equipos y órdenes al montar el componente
  useEffect(() => {
    fetchClientes();
    fetchEquipos();
    fetchOrdenes(1);
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
        setClienteSeleccionado(clienteFromNav);
        setEquipoSeleccionado(null);
        setBusquedaCliente(clienteFromNav.razon_social || "");
        setBusquedaSerie("");
        setBusquedaCodigo("");
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
        cliente: clienteFromNav.razon_social || "",
        direccion: clienteFromNav.direccion || "",
        comuna: clienteFromNav.comuna || "",
        contacto: clienteFromNav.contacto_nombre || "",
        fonoPrincipal: clienteFromNav.telefono || clienteFromNav.contacto_fono || "",
        tecnicoAsignado: "",
        equipo: "",
        modelo: "",
        marca: "",
        serie: "",
        contadorPagOut: "",
        nivelTinta: "",
        averia: ""
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
    const fechaActual = new Date().toISOString().split("T")[0];
    const numeroOt = await calcularSiguienteNumeroOrden();
    setNuevaOrden(prev => ({
      ...prev,
      numeroOrden: numeroOt,
      fecha: fechaActual
    }));
    setEditingId(null);
    setClienteSeleccionado(null);
    setEquipoSeleccionado(null);
    setBusquedaCliente("");
    setBusquedaSerie("");
    setBusquedaCodigo("");
    setInsumos([
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" }, { nombre: "" }
    ]);
    setInsumosVisibles(2);
    setErrorNumeroOrden("");
    setMostrarFormulario(true);
  };

  // Cierra los dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (equipoDropdownRef.current && !equipoDropdownRef.current.contains(event.target)) {
        setMostrarDropdownEquipos(false);
      }
      if (equipoCodigoDropdownRef.current && !equipoCodigoDropdownRef.current.contains(event.target)) {
        setMostrarDropdownCodigo(false);
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

  const fetchOrdenes = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/ordenes?page=${page}&limit=100`);
      setOrdenes(res.data.ordenes);
      setPagination(prev => ({ ...prev, currentPage: page, totalItems: res.data.pagination.totalItems }));
    } catch (err) {
      console.error("Error al cargar órdenes:", err);
    } finally {
      setLoading(false);
    }
  };

  const ordenesFiltradas = ordenes.filter(orden => {
    if (!filtroNumeroOrden) return true;
    return orden.numero_orden?.toLowerCase().includes(filtroNumeroOrden.toLowerCase());
  });

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
      cliente: orden.cliente || "",
      direccion: orden.direccion || "",
      comuna: orden.comuna || "",
      contacto: orden.contacto || "",
      fonoPrincipal: orden.fono_principal || "",
      tecnicoAsignado: orden.tecnico_asignado || "",
      equipo: orden.equipo || "",
      modelo: orden.modelo || "",
      marca: orden.marca || "",
      serie: orden.serie || "",
      contadorPagOut: orden.contador_pag_out || "",
      nivelTinta: orden.nivel_tinta || "",
      averia: orden.averia || ""
    });

    // Buscar equipo asociado en la lista cargada
    const eq = equipos.find(e => 
      (orden.equipo_id && e.id === orden.equipo_id) || 
      (orden.serie && e.serie === orden.serie)
    );
    if (eq) {
      setEquipoSeleccionado(eq);
      setBusquedaCodigo(eq.codigo || "");
      setBusquedaSerie(eq.serie || "");
    } else if (orden.serie) {
      setBusquedaSerie(orden.serie);
    }

    // Buscar cliente asociado en la lista cargada
    const cl = clientes.find(c => 
      (orden.cliente_id && c.id === orden.cliente_id) || 
      (orden.cliente && c.razon_social === orden.cliente)
    );
    if (cl) {
      setClienteSeleccionado(cl);
      setBusquedaCliente(cl.razon_social || orden.cliente || "");
    } else {
      setBusquedaCliente(orden.cliente || "");
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

  const eliminarOrden = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar esta orden de trabajo?")) return;
    try {
      await api.delete(`/api/ordenes/${id}`);
      alert("Orden eliminada exitosamente");
      fetchOrdenes(pagination.currentPage);
    } catch (err) {
      console.error("Error al eliminar orden:", err);
      alert("Error al eliminar la orden");
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await api.get("/api/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    }
  };

  const fetchEquipos = async () => {
    try {
      const res = await api.get("/api/equipos");
      setEquipos(res.data);
    } catch (err) {
      console.error("Error al cargar equipos:", err);
    }
  };

  // Seleccionar cliente y cargar sus datos
  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setNuevaOrden(prev => ({
      ...prev,
      cliente: cliente.razon_social || "",
      direccion: cliente.direccion || "",
      comuna: cliente.comuna || "",
      contacto: cliente.contacto_nombre || "",
      fonoPrincipal: cliente.telefono || cliente.contacto_fono || ""
    }));
    setBusquedaCliente(cliente.razon_social || "");
    setMostrarDropdownClientes(false);
  };

  // Seleccionar equipo por serie - NO carga avería (puede haber duplicados)
  const seleccionarEquipo = (equipo) => {
    setEquipoSeleccionado(equipo);
    setNuevaOrden(prev => ({
      ...prev,
      equipo: equipo.equipo || "",
      modelo: equipo.modelo || "",
      marca: equipo.marca || "",
      serie: equipo.serie || "",
      contadorPagOut: equipo.contador_pag?.toString() || "",
      nivelTinta: equipo.nivel_tintas || ""
      // NOTA: No carga avería aquí, solo al buscar por código
    }));
    
    // Cargar insumos del equipo
    const insumosEquipo = [];
    for (let i = 1; i <= 12; i++) {
      const insumo = equipo[`insumo${i}`];
      if (insumo) insumosEquipo.push({ nombre: insumo });
    }
    
    const nuevosInsumos = [...insumosEquipo];
    while (nuevosInsumos.length < 12) {
      nuevosInsumos.push({ nombre: "" });
    }
    setInsumos(nuevosInsumos);
    setInsumosVisibles(Math.max(2, insumosEquipo.length));
    
     setBusquedaSerie(equipo.serie || "");
     setMostrarDropdownEquipos(false);
  };

  const seleccionarEquipoPorCodigo = async (codigo) => {
    try {
      const res = await api.get(`/api/equipos?q=${encodeURIComponent(codigo)}`);
      const eq = res.data[0];
      if (!eq) return;
      setEquipoSeleccionado(eq);
      setMostrarDropdownCodigo(false);
      setNuevaOrden(prev => ({
        ...prev,
        equipo: eq.equipo || "",
        modelo: eq.modelo || "",
        marca: eq.marca || "",
        serie: eq.serie || "",
        contadorPagOut: eq.contador_pag?.toString() || "",
        nivelTinta: eq.nivel_tintas || "",
        averia: eq.averia || ""
      }));
      const insumosEquipo = [];
      for (let i = 1; i <= 12; i++) {
        const insumo = eq[`insumo${i}`];
        if (insumo) insumosEquipo.push({ nombre: insumo });
      }
      const nuevosInsumos = [...insumosEquipo];
      while (nuevosInsumos.length < 12) {
        nuevosInsumos.push({ nombre: "" });
      }
      setInsumos(nuevosInsumos);
      setInsumosVisibles(Math.max(2, insumosEquipo.length));
      setBusquedaSerie(eq.serie || "");
      setBusquedaCodigo(codigo);

      // Si el equipo tiene cliente asociado, cargarlo
      if (eq.cliente_id) {
        const resC = await api.get(`/api/clientes`);
        const cliente = resC.data.find(c => c.id === eq.cliente_id);
        if (cliente) {
          setClienteSeleccionado(cliente);
          setBusquedaCliente(cliente.razon_social);
          setNuevaOrden(prev => ({
            ...prev,
            cliente: cliente.razon_social || "",
            direccion: cliente.direccion || "",
            comuna: cliente.comuna || "",
            contacto: cliente.contacto_nombre || "",
            fonoPrincipal: cliente.telefono || cliente.contacto_fono || ""
          }));
        }
      }
    } catch (err) {
      console.error("Error al buscar por código:", err);
    }
  };

  // Filtrar clientes y equipos para la búsqueda
  const clientesFiltrados = busquedaCliente.length >= 2 ? clientes.filter(c => 
    c.razon_social?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.rut?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.codigo?.toLowerCase().includes(busquedaCliente.toLowerCase())
  ).slice(0, 10) : [];

   const equiposFiltrados = busquedaSerie.length >= 2 ? equipos.filter(e => {
     const serie = busquedaSerie.toLowerCase();
     return e.serie?.toLowerCase().includes(serie);
   }).slice(0, 10) : [];

   const equiposCodigoFiltrados = busquedaCodigo.length >= 2 ? equipos.filter(e => {
     const codigo = busquedaCodigo.toLowerCase();
     return e.codigo?.toLowerCase().includes(codigo);
   }).slice(0, 10) : [];

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

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const actualizarInsumo = (idx, valor) => {
    const nuevos = [...insumos];
    nuevos[idx].nombre = valor;
    setInsumos(nuevos);
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
      setMostrarFormulario(false);
      resetFormulario();
      fetchOrdenes(1);
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
      averia: ""
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
    setEditingId(null);
    setErrorNumeroOrden("");
    setFiltroNumeroOrden("");
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
            ordenes={ordenes}
            loading={loading}
            filtroNumeroOrden={filtroNumeroOrden}
            onFiltroChange={setFiltroNumeroOrden}
            onNueva={abrirNuevaOrden}
            pagination={pagination}
            onPageChange={fetchOrdenes}
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
                <h2><Wrench size={20} /> {editingId ? "Editar Orden" : "Nueva Orden"}</h2>
                <button type="button" className="of-head-close" onClick={() => { 
      const navState = window.history.state?.usr;
      const vinoDeCliente = navState?.cliente || navState?.orden;
      setMostrarFormulario(false); 
      resetFormulario(); 
      setEditingId(null); 
      window.history.replaceState({}, document.title); 
      if (vinoDeCliente) navigate("/clientes");
    }}><X size={18} /></button>
              </div>
            <form onSubmit={guardarOrden} className="of-form">
              {/* SECCIÓN 1: DATOS DE LA ORDEN */}
              <div className="of-sec primary">
                <div className="of-st primary">Datos de la Orden</div>
                
                <div className="of-grid">
                  {/* Número de Orden */}
                  <div className="of-f">
                    <label>
                      Número de Orden *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: OT-2024-001"
                      value={nuevaOrden.numeroOrden}
                      onChange={(e) => {
                        setNuevaOrden({...nuevaOrden, numeroOrden: e.target.value});
                        verificarNumeroOrden(e.target.value);
                      }}
                      required
                      
                    />
                    {errorNumeroOrden && (
                      <span style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={14} /> {errorNumeroOrden}
                      </span>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="of-f">
                    <label>
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={nuevaOrden.fecha}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, fecha: e.target.value})}
                      required
                    />
                  </div>

                  {/* Garantía Checkbox */}
                  <div className="of-f" style={{justifyContent:'center'}}>
                    <label className="of-chk">
                      <input
                        type="checkbox"
                        checked={nuevaOrden.esGarantia}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, esGarantia: e.target.checked})}
                      />
                      Es Garantía
                    </label>
                  </div>
                </div>

                {/* Fechas con Checkboxes */}
                <div className="of-dates">
                  <div className="of-date">
                    <input type="checkbox" checked={nuevaOrden.fechaIngresoCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaIngresoCheck: e.target.checked})} />
                    <span style={{fontSize:'.75rem',fontWeight:600}}>Ingreso</span>
                    {nuevaOrden.fechaIngresoCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaIngreso} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaIngreso: e.target.value})} /></div>}
                  </div>
                  <div className="of-date">
                    <input type="checkbox" checked={nuevaOrden.fechaTerminoCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaTerminoCheck: e.target.checked})} />
                    <span style={{fontSize:'.75rem',fontWeight:600}}>Término</span>
                    {nuevaOrden.fechaTerminoCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaTermino} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaTermino: e.target.value})} /></div>}
                  </div>
                  <div className="of-date">
                    <input type="checkbox" checked={nuevaOrden.fechaEntregaCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaEntregaCheck: e.target.checked})} />
                    <span style={{fontSize:'.75rem',fontWeight:600}}>Entrega</span>
                    {nuevaOrden.fechaEntregaCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaEntrega} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaEntrega: e.target.value})} /></div>}
                  </div>
                  <div className="of-date">
                    <input type="checkbox" checked={nuevaOrden.fechaCompraCheck} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaCompraCheck: e.target.checked})} />
                    <span style={{fontSize:'.75rem',fontWeight:600}}>Compra</span>
                    {nuevaOrden.fechaCompraCheck && <div className="of-date-f"><input type="date" value={nuevaOrden.fechaCompra} onChange={(e) => setNuevaOrden({...nuevaOrden, fechaCompra: e.target.value})} /></div>}
                  </div>
                </div>
              </div>

{/* SECCIÓN 2: DATOS DEL CLIENTE */}
              <div className="of-sec success">
                <div className="of-st success">Datos del Cliente</div>
                
                {/* Buscador de Cliente */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
                    <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
                    Buscar y Seleccionar Cliente
                  </label>
                  <div ref={clienteDropdownRef} style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Escriba para buscar cliente por nombre o RUT..."
                      value={busquedaCliente}
                      onChange={(e) => {
                        setBusquedaCliente(e.target.value);
                        setMostrarDropdownClientes(e.target.value.length >= 2);
                      }}
                      onFocus={() => {
                        if (busquedaCliente.length >= 2) setMostrarDropdownClientes(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '2px solid var(--primary)',
                        borderRadius: '6px',
                        fontSize: '.82rem',
                        background: clienteSeleccionado ? '#E0F2FE' : 'white'
                      }}
                    />
                    {clienteSeleccionado && (
                      <span style={{
                        position: 'absolute',
                        right: '40px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'var(--success)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        ✓ Seleccionado
                      </span>
                    )}
                    <ChevronDown 
                      size={20} 
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                      }}
                    />
                    
                    {/* Dropdown de Clientes */}
                    {mostrarDropdownClientes && busquedaCliente.length >= 2 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '2px solid var(--border)',
                        borderTop: 'none',
                        borderRadius: '0 0 8px 8px',
                        maxHeight: '250px',
                        overflow: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        {clientesFiltrados.length > 0 ? (
                          clientesFiltrados.map((cliente) => (
                            <div
                              key={cliente.id}
                              onClick={() => seleccionarCliente(cliente)}
                              style={{
                                padding: '6px 10px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border)',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                                  {cliente.codigo || 'CL-XXXX'}
                                </span>
                                <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                                  {cliente.razon_social}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                RUT: {cliente.rut || 'N/A'} | {cliente.direccion || ''}, {cliente.comuna || ''}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            No se encontraron clientes con "{busquedaCliente}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  <div className="of-f">
                    <label>
                      Cliente *
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre del cliente"
                      value={nuevaOrden.cliente}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, cliente: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '.82rem'
                      }}
                    />
                  </div>

                  <div className="of-f">
                    <label>
                      Dirección
                    </label>
                    <input
                      type="text"
                      placeholder="Dirección del cliente"
                      value={nuevaOrden.direccion}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, direccion: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '.82rem'
                      }}
                    />
                  </div>

                  <div className="of-f">
                    <label>
                      Comuna
                    </label>
                    <input
                      type="text"
                      placeholder="Comuna"
                      value={nuevaOrden.comuna}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, comuna: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '.82rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px'
                }}>
                  <div className="of-f">
                    <label>
                      Contacto
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre del contacto"
                      value={nuevaOrden.contacto}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, contacto: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '.82rem'
                      }}
                    />
                  </div>

                  <div className="of-f">
                    <label>
                      Fono Principal
                    </label>
                    <input
                      type="tel"
                      placeholder="Teléfono de contacto"
                      value={nuevaOrden.fonoPrincipal}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, fonoPrincipal: e.target.value.replace(/[^0-9+]/g, '')})}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '.82rem'
                      }}
                    />
                  </div>

                  <div className="of-f">
                    <label>
                      Técnico Asignado *
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre y apellido del técnico"
                      value={nuevaOrden.tecnicoAsignado}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, tecnicoAsignado: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
                      required
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '.82rem'
                      }}
                    />
                  </div>
                </div>

              </div>

              {/* SECCIÓN 3: DATOS DEL EQUIPO */}
              <div className="of-sec muted">
                <div className="of-st muted">Datos del Equipo</div>
                
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'8px'}}>
                  {/* Buscador por Código de Equipo */}
                  <div>
                    <div ref={equipoCodigoDropdownRef} style={{ position: 'relative' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
                        <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
                        Buscar por código (EQ-XXX)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: EQ-0001"
                        value={busquedaCodigo}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setBusquedaCodigo(val);
                          setMostrarDropdownCodigo(val.length >= 6);
                        }}
                        onFocus={() => {
                          if (busquedaCodigo.length >= 6) setMostrarDropdownCodigo(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '2px solid var(--info)',
                          borderRadius: '6px',
                          fontSize: '.82rem',
                          background: equipoSeleccionado?.codigo === busquedaCodigo ? '#DCFCE7' : 'white'
                        }}
                      />
                      
                      {/* Dropdown de Equipos por Código */}
                      {mostrarDropdownCodigo && busquedaCodigo.length >= 6 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '2px solid var(--border)',
                          borderTop: 'none',
                          borderRadius: '0 0 8px 8px',
                          maxHeight: '250px',
                          overflow: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          {equiposCodigoFiltrados.length > 0 ? (
                            equiposCodigoFiltrados.map((equipo) => (
                              <div
                                key={equipo.id}
                                onClick={() => {
                                  seleccionarEquipoPorCodigo(equipo.codigo);
                                  setMostrarDropdownCodigo(false);
                                }}
                                style={{
                                  padding: '6px 10px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--border)',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                                  {equipo.codigo} - {equipo.equipo} {equipo.marca} {equipo.modelo}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                  Serie: {equipo.serie || 'N/A'} | Cliente: {equipo.cliente_nombre || 'N/A'}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              No se encontraron equipos con código "{busquedaCodigo}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buscador de Equipo - Solo por Serie */}
                 <div>
                   <div ref={equipoDropdownRef} style={{ position: 'relative' }}>
                     <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
                       <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
                       Buscar Equipo por Serie
                     </label>
                      <input
                        type="text"
                        placeholder="Ingrese número de serie..."
                        value={busquedaSerie}
                        onChange={(e) => {
                          setBusquedaSerie(e.target.value);
                          setMostrarDropdownEquipos(e.target.value.length >= 2);
                        }}
                        onFocus={() => {
                          if (busquedaSerie.length >= 2) setMostrarDropdownEquipos(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '2px solid var(--success)',
                          borderRadius: '6px',
                          fontSize: '.82rem',
                          background: equipoSeleccionado ? '#DCFCE7' : 'white'
                        }}
                      />
                    
                      {/* Dropdown de Equipos */}
                      {mostrarDropdownEquipos && busquedaSerie.length >= 2 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'white',
                          border: '2px solid var(--border)',
                          borderTop: 'none',
                          borderRadius: '0 0 8px 8px',
                          maxHeight: '250px',
                          overflow: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          {equiposFiltrados.length > 0 ? (
                            equiposFiltrados.map((equipo) => (
                              <div
                                key={equipo.id}
                                onClick={() => seleccionarEquipo(equipo)}
                                style={{
                                  padding: '6px 10px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--border)',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--success-light)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                              >
                                <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                                  {equipo.equipo} {equipo.marca} {equipo.modelo}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                  Serie: {equipo.serie || 'N/A'} | Código: {equipo.codigo || 'N/A'}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              No se encontraron equipos con serie "{busquedaSerie}"
                            </div>
                          )}
                        </div>
                      )}
                   </div>
                   
                   {equipoSeleccionado && (
                     <div style={{
                       background: 'var(--success-light)',
                       padding: '8px 16px',
                       borderRadius: '6px',
                       fontSize: '0.9rem',
                       color: 'var(--success)',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '8px',
                       marginTop: '8px'
                     }}>
                       ✓ Seleccionado: {equipoSeleccionado.equipo} - {equipoSeleccionado.marca} {equipoSeleccionado.modelo}
                     </div>
                   )}
                  </div>
                </div>
                  
                   <div style={{ 
                     display: 'grid', 
                     gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                     gap: '20px',
                     marginBottom: '20px'
                   }}>
                   <div className="of-f">
                    <label>
                       Equipo *
                     </label>
                    <input
                      type="text"
                      placeholder="Tipo de equipo"
                      value={nuevaOrden.equipo}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, equipo: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '.82rem'
                      }}
                    />
                  </div>

                  <div className="of-f">
                    <label>
                      Marca *
                    </label>
                    <input
                      type="text"
                      placeholder="Marca del equipo"
                      value={nuevaOrden.marca}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, marca: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '.82rem'
                      }}
                    />
                  </div>

                  <div className="of-f">
                    <label>
                      Modelo *
                    </label>
                    <input
                      type="text"
                      placeholder="Modelo del equipo"
                      value={nuevaOrden.modelo}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, modelo: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '.82rem'
                      }}
                    />
                  </div>

                  <div className="of-f">
                    <label>
                      Serie
                    </label>
                    <input
                      type="text"
                      placeholder="Número de serie"
                      value={nuevaOrden.serie}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, serie: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '2px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '.82rem'
                      }}
                    />
                  </div>
                 </div>

                 {/* CAMPOS ADICIONALES COMENTADOS - Descomentar para restaurar
                 <div style={{ 
                   display: 'grid', 
                   gridTemplateColumns: 'repeat(4, 1fr)', 
                   gap: '20px',
                   marginBottom: '20px'
                 }}>
                   <div className="of-f">
                    <label>
                       Contador Páginas OUT
                     </label>
                     <input
                       type="text"
                       placeholder="Contador"
                       value={nuevaOrden.contadorPagOut}
                       onChange={(e) => setNuevaOrden({...nuevaOrden, contadorPagOut: e.target.value})}
                       style={{
                         width: '100%',
                         padding: '6px 10px',
                         border: '2px solid var(--border)',
                         borderRadius: '6px',
                         fontSize: '.82rem'
                       }}
                     />
                   </div>

                   <div className="of-f">
                    <label>
                       Nivel Tinta
                     </label>
                     <input
                       type="text"
                       placeholder="Nivel de tinta"
                       value={nuevaOrden.nivelTinta}
                       onChange={(e) => setNuevaOrden({...nuevaOrden, nivelTinta: e.target.value})}
                       style={{
                         width: '100%',
                         padding: '6px 10px',
                         border: '2px solid var(--border)',
                         borderRadius: '6px',
                         fontSize: '.82rem'
                       }}
                     />
                   </div>
                 </div>
                 */}

                {/* Insumos Dinámicos */}
                <div className="of-sec" style={{background:'white'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
                    <span className="of-st muted">Insumos</span>
                    {insumosVisibles < 12 && (
                      <button type="button" className="of-btn-a" onClick={() => setInsumosVisibles(insumosVisibles + 1)}>
                        <Plus size={14} /> Agregar
                      </button>
                    )}
                  </div>
                  <div className="of-ins">
                    {insumos.slice(0, insumosVisibles).map((ins, idx) => (
                      <div key={idx} className="of-ins-item">
                        <div>
                          <label>Insumo {idx + 1}</label>
                          <input type="text" placeholder={`Insumo ${idx + 1}`} value={ins.nombre} onChange={(e) => actualizarInsumo(idx, e.target.value)} />
                        </div>
                        <button type="button" className="of-ins-del" onClick={() => {
                          const nuevas = insumos.filter((_, i) => i !== idx);
                          while (nuevas.length < 12) nuevas.push({ nombre: "" });
                          setInsumos(nuevas);
                          setInsumosVisibles(Math.max(2, insumosVisibles - 1));
                        }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: AVERÍA/FALLA/INCIDENCIA */}
              <div className="of-sec muted">
                <div className="of-st muted">Avería/Falla/Incidencia</div>
                <div className="of-f">
                  <textarea
                    placeholder="Describa la avería, falla o incidencia del equipo..."
                    value={nuevaOrden.averia}
                    onChange={(e) => setNuevaOrden({...nuevaOrden, averia: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>

              {/* Botones de acción del formulario */}
              <div className="of-sub">
                <button type="button" className="of-btn-c" onClick={() => { 
      const navState = window.history.state?.usr;
      const vinoDeCliente = navState?.cliente || navState?.orden;
      setMostrarFormulario(false); 
      resetFormulario(); 
      setEditingId(null); 
      window.history.replaceState({}, document.title); 
      if (vinoDeCliente) navigate("/clientes");
    }}>
                  <X size={16} /> Cancelar
                </button>
                <button type="submit" className="of-btn-p">
                  <Save size={16} /> {editingId ? "Guardar Cambios" : "Guardar Orden"}
                </button>
              </div>
            </form>
            </div>
          </div></>
        )}
    </div>
  );
}

export default OrdenTrabajo;