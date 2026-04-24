import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Home, Package, Users, UserCog, LogOut, 
  FileText, FileSpreadsheet, ClipboardList, Plus, Save, X, Wrench,
  Calendar, Phone, MapPin, User, AlertCircle, CheckSquare,
  Search, ChevronDown
} from "lucide-react";
import api from "../services/api";

function OrdenTrabajo() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [errorNumeroOrden, setErrorNumeroOrden] = useState("");
  
  // Estados para autocompletar clientes y equipos
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaEquipo, setBusquedaEquipo] = useState("");
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [mostrarDropdownEquipos, setMostrarDropdownEquipos] = useState(false);
  
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

  // Cargar clientes y equipos al montar el componente
  useEffect(() => {
    fetchClientes();
    fetchEquipos();
  }, []);

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

  // Seleccionar equipo y cargar sus datos
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
    
    setBusquedaEquipo(`${equipo.equipo} - ${equipo.marca} ${equipo.modelo}`);
    setMostrarDropdownEquipos(false);
  };

  // Filtrar clientes y equipos para la búsqueda
  const clientesFiltrados = clientes.filter(c => 
    c.razon_social?.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.rut?.toLowerCase().includes(busquedaCliente.toLowerCase())
  ).slice(0, 10);

  const equiposFiltrados = equipos.filter(e => 
    e.equipo?.toLowerCase().includes(busquedaEquipo.toLowerCase()) ||
    e.marca?.toLowerCase().includes(busquedaEquipo.toLowerCase()) ||
    e.modelo?.toLowerCase().includes(busquedaEquipo.toLowerCase()) ||
    e.serie?.toLowerCase().includes(busquedaEquipo.toLowerCase())
  ).slice(0, 10);

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

  const volverHome = () => {
    navigate("/home");
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
    setBusquedaEquipo("");
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
      <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px' }}>
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={volverHome}
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '8px',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClipboardList size={28} /> Orden de Trabajo
          </h1>
        </div>
        <div className="user-info" style={{ gap: '10px' }}>
          <button onClick={() => navigate("/home")} className="logout-btn" style={{ background: 'var(--primary)', color: 'white' }}>
            <Home size={18} />
            Inicio
          </button>
          <button onClick={() => navigate("/equipos")} className="logout-btn" style={{ background: 'var(--success)', color: 'white' }}>
            <Package size={18} />
            Equipos
          </button>
          <button onClick={() => navigate("/clientes")} className="logout-btn" style={{ background: 'var(--warning)', color: 'white' }}>
            <Users size={18} />
            Clientes
          </button>
          <button onClick={() => navigate("/informes")} className="logout-btn" style={{ background: '#EA580C', color: 'white' }}>
            <FileText size={18} />
            Informes
          </button>
          <button onClick={() => navigate("/cotizaciones")} className="logout-btn" style={{ background: '#DB2777', color: 'white' }}>
            <FileSpreadsheet size={18} />
            Cotizaciones
          </button>
          <button onClick={() => navigate("/usuarios")} className="logout-btn" style={{ background: '#0D9488', color: 'white' }}>
            <UserCog size={18} />
            Usuarios
          </button>
          <button onClick={cerrarSesion} className="logout-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ 
        maxWidth: '1200px',
        margin: '32px auto',
        padding: '0 24px'
      }}>
        {!mostrarFormulario ? (
          /* Vista de lista de órdenes */
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: 'var(--shadow)',
            padding: '40px',
            textAlign: 'center'
          }}>
            <ClipboardList size={64} style={{ color: '#8B5CF6', marginBottom: '24px' }} />
            <h2 style={{ color: 'var(--text)', marginBottom: '16px' }}>
              Orden de Trabajo
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Gestiona las órdenes de trabajo y accede a los informes técnicos y cotizaciones.
            </p>

            {/* Botones de acción */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center',
              marginBottom: '32px'
            }}>
              <button 
                onClick={() => setMostrarFormulario(true)}
                style={{
                  background: '#8B5CF6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 32px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                <Plus size={24} />
                Crear Orden de Trabajo
              </button>
            </div>

            {/* Botones de Informe Técnico e Informe Cotización */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center',
              borderTop: '1px solid var(--border)',
              paddingTop: '32px',
              marginTop: '16px'
            }}>
              <button 
                onClick={irAInformeTecnico}
                style={{
                  background: '#EA580C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 28px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                <FileText size={20} />
                Informe Técnico
              </button>
              <button 
                onClick={irAInformeCotizacion}
                style={{
                  background: '#DB2777',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 28px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                <FileSpreadsheet size={20} />
                Informe Cotización
              </button>
            </div>
          </div>
        ) : (
          /* Formulario para crear orden */
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: 'var(--shadow)',
            padding: '40px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '32px',
              paddingBottom: '24px',
              borderBottom: '2px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  background: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <Wrench size={32} />
                </div>
                <div>
                  <h2 style={{ margin: 0, color: 'var(--text)' }}>Crear Orden de Trabajo</h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>Complete los datos para generar una nueva orden</p>
                </div>
              </div>
              
              {/* Botón X para cerrar */}
              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  resetFormulario();
                }}
                className="icon-btn"
                style={{
                  background: 'var(--bg)',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--danger)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 'var(--danger)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
                title="Cerrar"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={guardarOrden}>
              {/* SECCIÓN 1: DATOS DE LA ORDEN */}
              <div style={{
                background: 'var(--primary-light)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ 
                  color: 'var(--primary)', 
                  marginBottom: '20px', 
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ClipboardList size={20} />
                  Datos de la Orden
                </h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  {/* Número de Orden */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
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
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: `2px solid ${errorNumeroOrden ? 'var(--danger)' : 'var(--border)'}`,
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                    {errorNumeroOrden && (
                      <span style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircle size={14} /> {errorNumeroOrden}
                      </span>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={nuevaOrden.fecha}
                      onChange={(e) => setNuevaOrden({...nuevaOrden, fecha: e.target.value})}
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

                  {/* Garantía Checkbox */}
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '32px' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      color: 'var(--text)'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        border: '2px solid var(--primary)',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: nuevaOrden.esGarantia ? 'var(--primary)' : 'white'
                      }}>
                        {nuevaOrden.esGarantia && <CheckSquare size={18} color="white" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={nuevaOrden.esGarantia}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, esGarantia: e.target.checked})}
                        style={{ display: 'none' }}
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
              <div style={{
                background: 'var(--success-light)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ 
                  color: 'var(--success)', 
                  marginBottom: '20px', 
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <User size={20} />
                  Datos del Cliente
                </h3>
                
                {/* Buscador de Cliente */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                    <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
                    Buscar y Seleccionar Cliente
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Escriba para buscar cliente por nombre o RUT..."
                      value={busquedaCliente}
                      onChange={(e) => {
                        setBusquedaCliente(e.target.value);
                        setMostrarDropdownClientes(true);
                      }}
                      onFocus={() => setMostrarDropdownClientes(true)}
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
                    {mostrarDropdownClientes && clientesFiltrados.length > 0 && (
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
                        {clientesFiltrados.map((cliente) => (
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
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
                  gridTemplateColumns: 'repeat(3, 1fr)', 
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
              <div style={{
                background: '#F1F5F9',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ 
                  color: 'var(--text)', 
                  marginBottom: '20px', 
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Wrench size={20} />
                  Datos del Equipo
                </h3>
                
                {/* Buscador de Equipo */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)' }}>
                    <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
                    Buscar y Seleccionar Equipo
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Escriba para buscar equipo por tipo, marca, modelo o serie..."
                      value={busquedaEquipo}
                      onChange={(e) => {
                        setBusquedaEquipo(e.target.value);
                        setMostrarDropdownEquipos(true);
                      }}
                      onFocus={() => setMostrarDropdownEquipos(true)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid var(--success)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: equipoSeleccionado ? '#DCFCE7' : 'white'
                      }}
                    />
                    {equipoSeleccionado && (
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
                    
                    {/* Dropdown de Equipos */}
                    {mostrarDropdownEquipos && equiposFiltrados.length > 0 && (
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
                        {equiposFiltrados.map((equipo) => (
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
                              {equipo.equipo} - {equipo.marca} {equipo.modelo}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              Serie: {equipo.serie || 'N/A'} | Contador: {equipo.contador_pag || 'N/A'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
                        {idx >= 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const nuevas = insumos.filter((_, i) => i !== idx);
                              while (nuevas.length < 12) {
                                nuevas.push({ nombre: "" });
                              }
                              setInsumos(nuevas);
                              setInsumosVisibles(Math.max(2, insumosVisibles - 1));
                            }}
                            style={{
                              background: '#EF4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: AVERÍA/FALLA/INCIDENCIA */}
              <div style={{
                background: '#F1F5F9',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{ 
                  color: 'var(--text)', 
                  marginBottom: '16px', 
                  fontSize: '16px'
                }}>
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
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                justifyContent: 'flex-end',
                borderTop: '2px solid var(--border)',
                paddingTop: '24px'
              }}>
                <button 
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    resetFormulario();
                  }}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: '2px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <X size={20} />
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={20} />
                  Guardar Orden
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdenTrabajo;