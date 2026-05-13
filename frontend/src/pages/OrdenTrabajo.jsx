import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, Users, UserCog, LogOut, 
  FileText, FileSpreadsheet, ClipboardList, Plus, Save, X, Wrench,
  Calendar, Phone, MapPin, User, AlertCircle, CheckSquare,
  Search, ChevronDown, Trash2, ShoppingCart, Edit, Home
} from "lucide-react";
import api from "../services/api";

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
    actividad: "",
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
      const res = await api.get(`/api/ordenes?page=${page}&limit=10`);
      setOrdenes(res.data.ordenes);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Error al cargar órdenes:", err);
    } finally {
      setLoading(false);
    }
  };

  const editarOrden = async (orden) => {
    setEditingId(orden.id);
    setMostrarFormulario(true);
    
    // Cargar datos de la orden en el formulario
    setNuevaOrden({
      numeroOrden: orden.numero_orden || "",
      fecha: orden.fecha || "",
      esGarantia: orden.es_garantia || false,
      fechaIngreso: orden.fecha_ingreso || "",
      fechaIngresoCheck: orden.fecha_ingreso_check || false,
      fechaTermino: orden.fecha_termino || "",
      fechaTerminoCheck: orden.fecha_termino_check || false,
      fechaEntrega: orden.fecha_entrega || "",
      fechaEntregaCheck: orden.fecha_entrega_check || false,
      fechaCompra: orden.fecha_compra || "",
      fechaCompraCheck: orden.fecha_compra_check || false,
      cliente: orden.cliente || "",
      direccion: orden.direccion || "",
      comuna: orden.comuna || "",
      contacto: orden.contacto || "",
      fonoPrincipal: orden.fono_principal || "",
      tecnicoAsignado: orden.tecnico_asignado || "",
      actividad: orden.actividad || "",
      equipo: orden.equipo || "",
      modelo: orden.modelo || "",
      marca: orden.marca || "",
      serie: orden.serie || "",
      contadorPagOut: orden.contador_pag_out || "",
      nivelTinta: orden.nivel_tinta || "",
      averia: orden.averia || ""
    });

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
  const clientesFiltrados = clientes.filter(c => 
    c.razon_social?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.rut?.toLowerCase().includes(busquedaCliente.toLowerCase())
  ).slice(0, 10);

   const equiposFiltrados = equipos.filter(e => {
     const serie = busquedaSerie.toLowerCase();
     return !serie || e.serie?.toLowerCase().includes(serie);
   }).slice(0, 10);

   const equiposCodigoFiltrados = equipos.filter(e => {
     const codigo = busquedaCodigo.toLowerCase();
     return !codigo || e.codigo?.toLowerCase().includes(codigo);
   }).slice(0, 10);

  // Verificar número de orden único
  const verificarNumeroOrden = async (numero) => {
    if (!numero) return;
    try {
      const res = await api.get(`/api/ordenes/verificar/${numero}`);
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
      await api.post("/api/ordenes", payload);
      alert("Orden guardada exitosamente");
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
      actividad: "",
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
    setErrorNumeroOrden("");
  };

  const irAInformeTecnico = () => {
    navigate("/informes");
  };

  const irAInformeCotizacion = () => {
    navigate("/cotizaciones");
  };

  return (
    <div className="container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
        <div className="header-left">
          <h1 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClipboardList size={28} /> Orden de Trabajo
          </h1>
        </div>
        <div className="nav-buttons" style={{ gap: '10px' }}>
          <button onClick={() => navigate("/home")} className="logout-btn" style={{ background: 'var(--primary)', color: 'white' }}>
            <Home size={18} />
            <span className="btn-label">Inicio</span>
          </button>
          <button onClick={() => navigate("/clientes")} className="logout-btn" style={{ background: 'var(--warning)', color: 'white' }}>
            <Users size={18} />
            <span className="btn-label">Clientes</span>
          </button>
          <button onClick={() => navigate("/equipos")} className="logout-btn" style={{ background: 'var(--success)', color: 'white' }}>
            <Package size={18} />
            <span className="btn-label">Equipos</span>
          </button>
          <button onClick={() => navigate("/informes")} className="logout-btn" style={{ background: '#EA580C', color: 'white' }}>
            <FileText size={18} />
            <span className="btn-label">Informes Técnicos</span>
          </button>
          <button onClick={() => navigate("/cotizaciones")} className="logout-btn" style={{ background: '#DB2777', color: 'white' }}>
            <FileSpreadsheet size={18} />
            <span className="btn-label">Cotizaciones</span>
          </button>
          <button onClick={() => navigate("/orden-compra")} className="logout-btn" style={{ background: '#8B5CF6', color: 'white' }}>
            <ShoppingCart size={18} />
            <span className="btn-label">Orden de Compra</span>
          </button>
          <button onClick={() => navigate("/usuarios")} className="logout-btn" style={{ background: '#0D9488', color: 'white' }}>
            <UserCog size={18} />
            <span className="btn-label">Usuarios</span>
          </button>
          <button onClick={cerrarSesion} className="logout-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <LogOut size={18} />
            <span className="btn-label">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {!mostrarFormulario ? (
          <>
            <div className="table-header">
              <button onClick={() => setMostrarFormulario(true)} className="main-btn">
                <Plus size={20} />
                Nueva Orden
              </button>
            </div>

            {loading ? (
              <div className="empty-state">
                <ClipboardList size={48} />
                <p>Cargando órdenes...</p>
              </div>
            ) : ordenes.length === 0 ? (
              <div className="empty-state">
                <ClipboardList size={48} />
                <p>No hay órdenes registradas</p>
              </div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>N° Orden</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Equipo</th>
                        <th>Técnico</th>
                        <th>Garantía</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenes.map((orden) => (
                        <tr key={orden.id}>
                          <td data-label="N° Orden"><span style={{ fontWeight: '600', color: 'var(--primary)' }}>{orden.numero_orden}</span></td>
                          <td data-label="Fecha">{orden.fecha ? new Date(orden.fecha).toLocaleDateString() : '-'}</td>
                          <td data-label="Cliente">{orden.cliente}</td>
                          <td data-label="Equipo">{orden.equipo} {orden.marca} {orden.modelo}</td>
                          <td data-label="Técnico">{orden.tecnico_asignado}</td>
                          <td data-label="Garantía">
                            {orden.es_garantia ? (
                              <span className="badge-garantia">Sí</span>
                            ) : (
                              <span className="badge-no-garantia">No</span>
                            )}
                          </td>
                          <td data-label="Acciones">
                            <div className="action-buttons">
                              <button 
                                className="table-btn" 
                                style={{ background: '#EA580C', color: 'white', border: 'none' }}
                                onClick={() => navigate('/informes', { state: { orden } })}
                              >
                                <FileText size={14} /> Informe
                              </button>
                              <button 
                                className="table-btn" 
                                style={{ background: '#DB2777', color: 'white', border: 'none' }}
                                onClick={() => navigate('/cotizaciones', { state: { orden } })}
                              >
                                <FileSpreadsheet size={14} /> Cotización
                              </button>
                              <button className="table-btn edit-btn" onClick={() => editarOrden(orden)}>
                                <Edit size={14} /> Editar
                              </button>
                              <button className="table-btn delete-btn" onClick={() => eliminarOrden(orden.id)}>
                                <Trash2 size={14} /> Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="cards-table">
                  {ordenes.map((orden) => (
                    <div key={orden.id} className="data-card">
                      <div className="data-card-header">
                        <strong>{orden.numero_orden}</strong>
                        {orden.es_garantia ? (
                          <span className="badge-garantia">Garantía</span>
                        ) : (
                          <span className="badge-no-garantia">No garantía</span>
                        )}
                      </div>
                      <div className="data-card-row">
                        <span className="data-card-label">Fecha</span>
                        <span className="data-card-value">{orden.fecha ? new Date(orden.fecha).toLocaleDateString() : '-'}</span>
                      </div>
                      <div className="data-card-row">
                        <span className="data-card-label">Cliente</span>
                        <span className="data-card-value">{orden.cliente}</span>
                      </div>
                      <div className="data-card-row">
                        <span className="data-card-label">Equipo</span>
                        <span className="data-card-value">{orden.equipo} {orden.marca} {orden.modelo}</span>
                      </div>
                      <div className="data-card-row">
                        <span className="data-card-label">Técnico</span>
                        <span className="data-card-value">{orden.tecnico_asignado}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button 
                          className="table-btn" 
                          style={{ flex: 1, justifyContent: 'center', background: '#EA580C', color: 'white', border: 'none' }}
                          onClick={() => navigate('/informes', { state: { orden } })}
                        >
                          <FileText size={14} /> Informe
                        </button>
                        <button 
                          className="table-btn" 
                          style={{ flex: 1, justifyContent: 'center', background: '#DB2777', color: 'white', border: 'none' }}
                          onClick={() => navigate('/cotizaciones', { state: { orden } })}
                        >
                          <FileSpreadsheet size={14} /> Cotización
                        </button>
                        <button className="table-btn edit-btn" onClick={() => editarOrden(orden)} style={{ flex: 1, justifyContent: 'center' }}>
                          <Edit size={14} /> Editar
                        </button>
                        <button className="table-btn delete-btn" onClick={() => eliminarOrden(orden.id)} style={{ flex: 1, justifyContent: 'center' }}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pagination">
                  <div className="pagination-info">
                    Mostrando {ordenes.length} de {pagination.totalItems} órdenes
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="page-btn-nav"
                      onClick={() => fetchOrdenes(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      ‹
                    </button>
                    <span className="page-numbers-desktop">
                      {[...Array(pagination.totalPages)].map((_, i) => {
                        const num = i + 1;
                        return (
                          <button
                            key={num}
                            onClick={() => fetchOrdenes(num)}
                            className={pagination.currentPage === num ? 'active' : ''}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </span>
                    <button
                      className="page-btn-nav"
                      onClick={() => fetchOrdenes(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      ›
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                  <button onClick={irAInformeTecnico} className="main-btn" style={{ background: '#EA580C' }}>
                    <FileText size={18} /> Informe Técnico
                  </button>
                  <button onClick={irAInformeCotizacion} className="main-btn" style={{ background: '#DB2777' }}>
                    <FileSpreadsheet size={18} /> Informe Cotización
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          /* Formulario para crear orden */
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--gradient)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                  <Wrench size={28} />
                  {editingId ? "Editar Orden de Trabajo" : "Crear Orden de Trabajo"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    resetFormulario();
                    setEditingId(null);
                  }}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: 'white' }}
                >
                  <X size={24} />
                </button>
              </div>
            <form onSubmit={guardarOrden} style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              {/* SECCIÓN 1: DATOS DE LA ORDEN */}
              <div style={{ padding: '20px', background: 'var(--primary-light)', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '16px' }}>
                  Datos de la Orden
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  {/* Número de Orden */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: 'var(--text)' }}>
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
                      style={{ width: '100%', padding: '10px 14px', border: `2px solid ${errorNumeroOrden ? 'var(--danger)' : 'var(--border)'}`, borderRadius: '8px', fontSize: '0.95rem' }}
                    />
                    {errorNumeroOrden && (
                      <span style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={14} /> {errorNumeroOrden}
                      </span>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: 'var(--text)' }}>
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={nuevaOrden.fecha}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, fecha: e.target.value})}
                      required
                      style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem' }}
                    />
                  </div>

                  {/* Garantía Checkbox */}
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      color: 'var(--text)'
                    }}>
                      <input
                        type="checkbox"
                        checked={nuevaOrden.esGarantia}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, esGarantia: e.target.checked})}
                        style={{ width: '18px', height: '18px' }}
                      />
                      Es Garantía
                    </label>
                  </div>
                </div>

                {/* Fechas con Checkboxes */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '20px'
                }}>
                  {/* Fecha Ingreso */}
                  <div style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={nuevaOrden.fechaIngresoCheck}
                          onChange={(e) => setNuevaOrden({...nuevaOrden, fechaIngresoCheck: e.target.checked})}
                        />
                        Fecha Ingreso
                      </label>
                    </div>
                    {nuevaOrden.fechaIngresoCheck && (
                      <input
                        type="date"
                        value={nuevaOrden.fechaIngreso}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, fechaIngreso: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid var(--border)',
                          borderRadius: '6px'
                        }}
                      />
                    )}
                  </div>

                  {/* Fecha Término */}
                  <div style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={nuevaOrden.fechaTerminoCheck}
                          onChange={(e) => setNuevaOrden({...nuevaOrden, fechaTerminoCheck: e.target.checked})}
                        />
                        Fecha Término
                      </label>
                    </div>
                    {nuevaOrden.fechaTerminoCheck && (
                      <input
                        type="date"
                        value={nuevaOrden.fechaTermino}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, fechaTermino: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid var(--border)',
                          borderRadius: '6px'
                        }}
                      />
                    )}
                  </div>

                  {/* Fecha Entrega */}
                  <div style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={nuevaOrden.fechaEntregaCheck}
                          onChange={(e) => setNuevaOrden({...nuevaOrden, fechaEntregaCheck: e.target.checked})}
                        />
                        Fecha Entrega
                      </label>
                    </div>
                    {nuevaOrden.fechaEntregaCheck && (
                      <input
                        type="date"
                        value={nuevaOrden.fechaEntrega}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, fechaEntrega: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid var(--border)',
                          borderRadius: '6px'
                        }}
                      />
                    )}
                  </div>

                  {/* Fecha Compra */}
                  <div style={{ background: 'white', padding: '16px', borderRadius: '8px' }}>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={nuevaOrden.fechaCompraCheck}
                          onChange={(e) => setNuevaOrden({...nuevaOrden, fechaCompraCheck: e.target.checked})}
                        />
                        Fecha Compra
                      </label>
                    </div>
                    {nuevaOrden.fechaCompraCheck && (
                      <input
                        type="date"
                        value={nuevaOrden.fechaCompra}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, fechaCompra: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid var(--border)',
                          borderRadius: '6px'
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

{/* SECCIÓN 2: DATOS DEL CLIENTE */}
              <div style={{ padding: '20px', background: 'var(--success-light)', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--success)', marginBottom: '16px', fontSize: '16px' }}>Datos del Cliente</h3>
                
                {/* Buscador de Cliente */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
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
                        padding: '12px 16px',
                        border: '2px solid var(--primary)',
                        borderRadius: '8px',
                        fontSize: '1rem',
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
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border)',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                              <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                                {cliente.razon_social}
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
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
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
                        padding: '12px 16px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                      Dirección
                    </label>
                    <input
                      type="text"
                      placeholder="Dirección del cliente"
                      value={nuevaOrden.direccion}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, direccion: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                      Comuna
                    </label>
                    <input
                      type="text"
                      placeholder="Comuna"
                      value={nuevaOrden.comuna}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, comuna: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '20px'
                }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                      Contacto
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre del contacto"
                      value={nuevaOrden.contacto}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, contacto: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                      Fono Principal
                    </label>
                    <input
                      type="tel"
                      placeholder="Teléfono de contacto"
                      value={nuevaOrden.fonoPrincipal}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, fonoPrincipal: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                      Técnico Asignado *
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre y apellido del técnico"
                      value={nuevaOrden.tecnicoAsignado}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, tecnicoAsignado: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                {/* Actividad/Observaciones */}
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                    Actividad / Observaciones
                  </label>
                  <textarea
                    placeholder="Ingrese observaciones o actividad a realizar..."
                    value={nuevaOrden.actividad}
                    onChange={(e) => setNuevaOrden({...nuevaOrden, actividad: e.target.value})}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* SECCIÓN 3: DATOS DEL EQUIPO */}
              <div style={{ padding: '20px', background: '#f1f5f9', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--text)', marginBottom: '16px', fontSize: '16px' }}>
                  Datos del Equipo
                </h3>
                
                  {/* Buscador por Código de Equipo */}
                  <div style={{ marginBottom: '16px' }}>
                    <div ref={equipoCodigoDropdownRef} style={{ position: 'relative' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
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
                          padding: '10px 16px',
                          border: '2px solid var(--info)',
                          borderRadius: '8px',
                          fontSize: '1rem',
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
                                  padding: '12px 16px',
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
                 <div style={{ marginBottom: '24px' }}>
                   <div ref={equipoDropdownRef} style={{ position: 'relative' }}>
                     <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
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
                          padding: '12px 16px',
                          border: '2px solid var(--success)',
                          borderRadius: '8px',
                          fontSize: '1rem',
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
                                  padding: '12px 16px',
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
                       borderRadius: '8px',
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
                 
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                   <div className="form-group">
                     <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
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
                        padding: '12px 16px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
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
                        padding: '12px 16px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
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
                        padding: '12px 16px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                      Serie
                    </label>
                    <input
                      type="text"
                      placeholder="Número de serie"
                      value={nuevaOrden.serie}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, serie: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '1rem'
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
                   <div className="form-group">
                     <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                       Contador Páginas OUT
                     </label>
                     <input
                       type="text"
                       placeholder="Contador"
                       value={nuevaOrden.contadorPagOut}
                       onChange={(e) => setNuevaOrden({...nuevaOrden, contadorPagOut: e.target.value})}
                       style={{
                         width: '100%',
                         padding: '12px 16px',
                         border: '2px solid var(--border)',
                         borderRadius: '8px',
                         fontSize: '1rem'
                       }}
                     />
                   </div>

                   <div className="form-group">
                     <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                       Nivel Tinta
                     </label>
                     <input
                       type="text"
                       placeholder="Nivel de tinta"
                       value={nuevaOrden.nivelTinta}
                       onChange={(e) => setNuevaOrden({...nuevaOrden, nivelTinta: e.target.value})}
                       style={{
                         width: '100%',
                         padding: '12px 16px',
                         border: '2px solid var(--border)',
                         borderRadius: '8px',
                         fontSize: '1rem'
                       }}
                     />
                   </div>
                 </div>
                 */}

                {/* Insumos Dinámicos */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '16px' }}>Insumos</h4>
                    {insumosVisibles < 12 && (
                      <button 
                        type="button"
                        onClick={() => setInsumosVisibles(insumosVisibles + 1)}
                        style={{
                          background: 'var(--success)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={16} /> Agregar
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {insumos.slice(0, insumosVisibles).map((ins, idx) => (
                      <div key={idx} className="form-group" style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Insumo {idx + 1}</label>
                          <input
                            type="text"
                            placeholder={`Insumo ${idx + 1}`}
                            value={ins.nombre}
                            onChange={(e) => actualizarInsumo(idx, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '2px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '0.95rem'
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          className="delete-btn"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px', marginBottom: '2px' }}
                          onClick={() => {
                            const nuevas = insumos.filter((_, i) => i !== idx);
                            while (nuevas.length < 12) {
                              nuevas.push({ nombre: "" });
                            }
                            setInsumos(nuevas);
                            setInsumosVisibles(Math.max(2, insumosVisibles - 1));
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: AVERÍA/FALLA/INCIDENCIA */}
              <div style={{ padding: '20px', background: '#f1f5f9', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--text)', marginBottom: '16px', fontSize: '16px' }}>
                  Avería/Falla/Incidencia
                </h3>
                <div className="form-group">
                  <textarea
                    placeholder="Describa la avería, falla o incidencia del equipo..."
                    value={nuevaOrden.averia}
                    onChange={(e) => setNuevaOrden({...nuevaOrden, averia: e.target.value})}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* Botones de acción del formulario */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '8px', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    resetFormulario();
                    setEditingId(null);
                  }}
                  className="cancel-btn"
                >
                  <X size={20} /> Cancelar
                </button>
                <button type="submit" className="main-btn">
                  <Save size={20} /> {editingId ? "Actualizar Orden" : "Guardar Orden"}
                </button>
              </div>
            </form>
            </div>
          </div>
        )}
    </div>
  );
}

export default OrdenTrabajo;