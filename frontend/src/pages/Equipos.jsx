import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Package, Plus, Save, Trash2, Edit, LogOut, Monitor, Printer, Scissors, Droplets, Search, ChevronDown, ChevronUp, Users, UserCog, FileText, FileSpreadsheet, ClipboardList, X, ShoppingCart, Home } from "lucide-react";
import api from "../services/api";
import './Equipos.css';

function Equipos() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [equipos, setEquipos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const equiposPorPagina = 5;

  const [nuevoEquipo, setNuevoEquipo] = useState({
    codigo: "",
    equipo: "",
    modelo: "",
    marca: "",
    serie: "",
    contador_pag: 0,
    nivel_tintas: "",
    cliente_id: "",
    insumo1: "",
    insumo2: "",
    insumo3: "",
    insumo4: "",
    insumo5: "",
    insumo6: "",
    insumo7: "",
    insumo8: "",
    insumo9: "",
    insumo10: "",
    insumo11: "",
    insumo12: "",
    averia: ""
  });

  const [clientes, setClientes] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const clienteDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target)) {
        setMostrarDropdownClientes(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [insumos, setInsumos] = useState([
    { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
    { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
    { nombre: "" }, { nombre: "" }, { nombre: "" }
  ]);
  const [insumosVisibles, setInsumosVisibles] = useState(2);
  const [mostrarExtras, setMostrarExtras] = useState(false);
  const [mostrarExtrasEditar, setMostrarExtrasEditar] = useState(false);
  const [codigoActual, setCodigoActual] = useState("");
  const [equiposExpandidos, setEquiposExpandidos] = useState({});

  useEffect(() => {
    if (mostrarFormulario) {
      setCodigoActual(calcularSiguienteCodigo());
    }
  }, [mostrarFormulario, equipos]);

  const token = localStorage.getItem("token");
  let usuarioActual = "Usuario";

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      usuarioActual = payload.usuario;
    } catch {
      usuarioActual = "Usuario";
    }
  }

  const fetchEquipos = async () => {
    try {
      const res = await api.get("/api/equipos");
      setEquipos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await api.get("/api/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const calcularSiguienteCodigo = () => calcularSiguienteCodigoDesde(equipos);

  const calcularSiguienteCodigoDesde = (lista) => {
    let max = 0;
    lista.forEach(eq => {
      if (eq.codigo && eq.codigo.startsWith("EQ-")) {
        const num = parseInt(eq.codigo.split("-")[1], 10);
        if (num > max) max = num;
      }
    });
    return `EQ-${String(max + 1).padStart(4, "0")}`;
  };

  useEffect(() => {
    fetchEquipos();
    fetchClientes();
  }, []);

  const equiposFiltrados = equipos.filter(eq => {
    const textoBusqueda = busqueda.toLowerCase();
    return !textoBusqueda || 
      eq.serie?.toLowerCase().includes(textoBusqueda) || 
      eq.codigo?.toLowerCase().includes(textoBusqueda) ||
      eq.cliente_nombre?.toLowerCase().includes(textoBusqueda);
  });

  const totalPaginas = Math.ceil(equiposFiltrados.length / equiposPorPagina);
  const indiceInicio = (paginaActual - 1) * equiposPorPagina;
  const equiposPagina = equiposFiltrados.slice(indiceInicio, indiceInicio + equiposPorPagina);

  useEffect(() => {
    fetchEquipos();
    fetchClientes();
  }, []);

  useEffect(() => {
    const clienteId = params.get("clienteId");
    const clienteNombre = params.get("clienteNombre");
    if (clienteId && clienteNombre && equipos.length > 0) {
      setClienteSeleccionado({ id: clienteId, razon_social: clienteNombre });
      setBusquedaCliente(clienteNombre);
      setNuevoEquipo(prev => ({ ...prev, cliente_id: clienteId }));
      setBusqueda(clienteNombre);
    }
  }, [equipos]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  const limpiarFiltros = () => {
    setBusqueda("");
  };

  const actualizarInsumo = (idx, valor) => {
    const nuevos = [...insumos];
    nuevos[idx].nombre = valor;
    setInsumos(nuevos);
  };

  const guardarEquipo = async (e) => {
    e.preventDefault();
    if (!nuevoEquipo.cliente_id) {
      alert("Debe seleccionar un cliente para asociar al equipo");
      return;
    }
    const ins = insumos.filter(i => i.nombre.trim() !== "").map(i => i.nombre);
    const payload = {
      ...nuevoEquipo,
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
      if (equipoEditando) {
        await api.put(`/api/equipos/${equipoEditando.id}`, payload);
      } else {
        await api.post("/api/equipos", payload);
      }
      setNuevoEquipo({ equipo: "", modelo: "", marca: "", serie: "", contador_pag: 0, nivel_tintas: "", codigo: "", cliente_id: "", insumo1: "", insumo2: "", insumo3: "", insumo4: "", insumo5: "", insumo6: "", insumo7: "", insumo8: "", insumo9: "", insumo10: "", insumo11: "", insumo12: "", averia: "" });
      setInsumos([
        { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
        { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
        { nombre: "" }, { nombre: "" }, { nombre: "" }
      ]);
      setInsumosVisibles(2);
      setMostrarFormulario(false);
      setEquipoEditando(null);
      setClienteSeleccionado(null);
      setBusquedaCliente("");
      navigate('/equipos', { replace: true });
      const res = await api.get("/api/equipos");
      setEquipos(res.data);
      setCodigoActual(calcularSiguienteCodigoDesde(res.data));
    } catch (err) {
      alert("Error al guardar");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const editarEquipo = (eq) => {
    setEquipoEditando(eq);
    setMostrarExtras(true);
    setMostrarExtrasEditar(true);
    const arr = [
      { nombre: eq.insumo1 || "" }, { nombre: eq.insumo2 || "" }, { nombre: eq.insumo3 || "" },
      { nombre: eq.insumo4 || "" }, { nombre: eq.insumo5 || "" }, { nombre: eq.insumo6 || "" },
      { nombre: eq.insumo7 || "" }, { nombre: eq.insumo8 || "" }, { nombre: eq.insumo9 || "" },
      { nombre: eq.insumo10 || "" }, { nombre: eq.insumo11 || "" }, { nombre: eq.insumo12 || "" }
    ];
    while (arr.length < 12) arr.push({ nombre: "" });
    setInsumos(arr);
    setInsumosVisibles(arr.filter(i => i.nombre).length || 2);
    setNuevoEquipo({
      codigo: eq.codigo || "",
      equipo: eq.equipo,
      modelo: eq.modelo,
      marca: eq.marca,
      serie: eq.serie || "",
      contador_pag: eq.contador_pag || 0,
      nivel_tintas: eq.nivel_tintas || "",
      cliente_id: eq.cliente_id || "",
      insumo1: eq.insumo1 || "",
      insumo2: eq.insumo2 || "",
      insumo3: eq.insumo3 || "",
      insumo4: eq.insumo4 || "",
      insumo5: eq.insumo5 || "",
      insumo6: eq.insumo6 || "",
      insumo7: eq.insumo7 || "",
      insumo8: eq.insumo8 || "",
      insumo9: eq.insumo9 || "",
      insumo10: eq.insumo10 || "",
      insumo11: eq.insumo11 || "",
      insumo12: eq.insumo12 || "",
      averia: eq.averia || ""
    });
    if (eq.cliente_id) {
      const c = clientes.find(cl => cl.id === eq.cliente_id);
      if (c) {
        setClienteSeleccionado(c);
        setBusquedaCliente(c.razon_social);
      }
    }
    setMostrarFormulario(true);
  };

  const eliminarEquipo = async (id) => {
    if (!window.confirm("¿Eliminar este equipo?")) return;
    try {
      await api.delete(`/api/equipos/${id}`);
      fetchEquipos();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente(cliente.razon_social);
    setNuevoEquipo(prev => ({ ...prev, cliente_id: cliente.id }));
    setMostrarDropdownClientes(false);
  };

  const clientesFiltrados = busquedaCliente.length >= 2 ? clientes.filter(c =>
    c.razon_social?.toLowerCase().includes(busquedaCliente.toLowerCase())
  ).slice(0, 8) : [];

  const getIcono = (equipo) => {
    const eq = equipo?.toLowerCase() || "";
    if (eq.includes('impresora')) return <Printer size={24} />;
    if (eq.includes('scanner')) return <Monitor size={24} />;
    if (eq.includes('lector')) return <Scissors size={24} />;
    return <Package size={24} />;
  };


if (mostrarFormulario) {
    return (
      <><div className="container">
        <div style={{ maxWidth: '740px', margin: '0 auto', padding: '20px' }}>
          <div className="ef-wrap">
            <div className="ef-head">
              <h2><Package size={22} />{equipoEditando ? "Editar Equipo" : "Nuevo Equipo"}</h2>
              <button type="button" className="ef-head-close" onClick={() => {
                setMostrarFormulario(false);
                setEquipoEditando(null);
                setClienteSeleccionado(null);
                setBusquedaCliente("");
                setNuevoEquipo({ equipo: "", modelo: "", marca: "", serie: "", contador_pag: 0, nivel_tintas: "", codigo: "", cliente_id: "", insumo1: "", insumo2: "", insumo3: "", insumo4: "", insumo5: "", insumo6: "", insumo7: "", insumo8: "", insumo9: "", insumo10: "", insumo11: "", insumo12: "", averia: "" });
                setMostrarExtras(false);
                setMostrarExtrasEditar(false);
                navigate('/equipos', { replace: true });
              }}><X size={20} /></button>
            </div>
            <form onSubmit={guardarEquipo} className="ef-form">
              <div className="ef-s primary">
                <div className="ef-st primary">Información del Equipo</div>
                <div className="ef-r2" style={{ marginBottom: '8px' }}>
                  <div className="ef-f ef-code">
                    <label>Código</label>
                    <input value={equipoEditando ? (equipoEditando.codigo || codigoActual) : codigoActual} disabled />
                  </div>
                  <div className="ef-f">
                    <label>Cliente Asociado *</label>
                    <div ref={clienteDropdownRef} className="ef-sc">
                      <input placeholder="Buscar cliente..." value={busquedaCliente}
                        onChange={(e) => { setBusquedaCliente(e.target.value); setMostrarDropdownClientes(e.target.value.length >= 2); }}
                        onFocus={() => { if (busquedaCliente.length >= 2) setMostrarDropdownClientes(true); }} required />
                      {clienteSeleccionado && <span className="ef-sc-ok">✓</span>}
                      {mostrarDropdownClientes && clientesFiltrados.length > 0 && (
                        <div className="ef-sc-dd">
                          {clientesFiltrados.map((c) => (
                            <div key={c.id} className="ef-sc-item" onClick={() => seleccionarCliente(c)}>
                              <div><strong>{c.razon_social}</strong></div>
                              <small>RUT: {c.rut || 'N/A'}</small>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ef-r2">
                  <div className="ef-f">
                    <label>Equipo *</label>
                    <input placeholder="Nombre del equipo" value={nuevoEquipo.equipo}
                      onChange={e => setNuevoEquipo({...nuevoEquipo, equipo: e.target.value})} required />
                  </div>
                  <div className="ef-f">
                    <label>Marca *</label>
                    <input placeholder="Marca" value={nuevoEquipo.marca}
                      onChange={e => setNuevoEquipo({...nuevoEquipo, marca: e.target.value})} required />
                  </div>
                </div>
                <div className="ef-r3" style={{ marginTop: '8px' }}>
                  <div className="ef-f">
                    <label>Modelo *</label>
                    <input placeholder="Modelo" value={nuevoEquipo.modelo}
                      onChange={e => setNuevoEquipo({...nuevoEquipo, modelo: e.target.value})} required />
                  </div>
                  <div className="ef-f">
                    <label>Serie</label>
                    <input placeholder="Número de serie" value={nuevoEquipo.serie}
                      onChange={e => setNuevoEquipo({...nuevoEquipo, serie: e.target.value})} />
                  </div>
                  <div className="ef-f">
                    <label>Contador Páginas</label>
                    <input type="number" placeholder="Contador" value={nuevoEquipo.contador_pag}
                      onChange={e => setNuevoEquipo({...nuevoEquipo, contador_pag: e.target.value})} />
                  </div>
                </div>
                <div className="ef-f" style={{ marginTop: '8px' }}>
                  <label>Nivel Tintas</label>
                  <input placeholder="Nivel de tintas" value={nuevoEquipo.nivel_tintas}
                    onChange={e => setNuevoEquipo({...nuevoEquipo, nivel_tintas: e.target.value})} />
                </div>
              </div>
              <div className="ef-s success">
                <div className="ef-st success">
                  <span>Insumos</span>
                  {insumosVisibles < 12 && (
                    <button type="button" className="ef-btn-a" onClick={() => setInsumosVisibles(insumosVisibles + 1)}>+ Agregar</button>
                  )}
                </div>
                <div className="ef-ins">
                  {insumos.slice(0, insumosVisibles).map((ins, idx) => (
                    <div key={idx} className="ef-ins-item">
                      <div>
                        <label>Insumo {idx + 1}</label>
                        <input placeholder={`Insumo ${idx + 1}`} value={ins.nombre}
                          onChange={e => actualizarInsumo(idx, e.target.value)} />
                      </div>
                      <button type="button" className="ef-ins-del"
                        onClick={() => {
                          const nuevas = insumos.filter((_, i) => i !== idx);
                          while (nuevas.length < 12) nuevas.push({ nombre: "" });
                          setInsumos(nuevas);
                          setInsumosVisibles(Math.max(2, insumosVisibles - 1));
                        }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ef-s muted">
                <div className="ef-st muted">Avería/Falla/Incidencia</div>
                <div className="ef-f">
                  <textarea placeholder="Descripción de falla o incidencia..." value={nuevoEquipo.averia}
                    onChange={e => setNuevoEquipo({...nuevoEquipo, averia: e.target.value})} rows={3} style={{ minHeight: '70px' }} />
                </div>
              </div>
              <div className="ef-sub">
                <button type="button" className="ef-btn-c" onClick={() => {
                  setMostrarFormulario(false);
                  setEquipoEditando(null);
                  setClienteSeleccionado(null);
                  setBusquedaCliente("");
                  setNuevoEquipo({ equipo: "", modelo: "", marca: "", serie: "", contador_pag: 0, nivel_tintas: "", codigo: "", cliente_id: "", insumo1: "", insumo2: "", insumo3: "", insumo4: "", insumo5: "", insumo6: "", insumo7: "", insumo8: "", insumo9: "", insumo10: "", insumo11: "", insumo12: "", averia: "" });
                  setInsumos([{ nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }]);
                  setInsumosVisibles(2);
                  navigate('/equipos', { replace: true });
                }}><X size={18} /> Cancelar</button>
                <button type="submit" className="ef-btn-p"><Save size={18} /> {equipoEditando ? "Guardar Cambios" : "Guardar Equipo"}</button>
              </div>
            </form>
          </div>
        </div>
      </div></>
    );
  }

  return (
    <>
    <div className="container">
      <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
        <div className="header-left">
          <h1 style={{ color: 'white' }}><Package size={28} /> Mantenedor de Equipos</h1>
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
          <button onClick={() => navigate("/orden-trabajo")} className="logout-btn" style={{ background: '#6366F1', color: 'white' }}>
            <ClipboardList size={18} />
            <span className="btn-label">Orden de Trabajo</span>
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

      <div className="filters-section">
        <div className="filters-content">
          <div className="filtro-grupo-equipos">
            <label>Buscar por Serie, Código o Cliente</label>
            <input
              type="text"
              placeholder="Serie, código (EQ-XXXX) o nombre del cliente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button onClick={limpiarFiltros} className="clear-btn">
            Limpiar
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Equipo</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Serie</th>
              <th>Cliente</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {equiposPagina.map((eq) => {
              const expandido = equiposExpandidos[eq.id];
              const insumosEquipo = [eq.insumo1, eq.insumo2, eq.insumo3, eq.insumo4, eq.insumo5, eq.insumo6, eq.insumo7, eq.insumo8, eq.insumo9, eq.insumo10, eq.insumo11, eq.insumo12].filter(i => i && i.trim());
              return (
                <>
                  <tr key={eq.id} style={{ cursor: busqueda ? 'pointer' : 'default' }} onClick={() => busqueda && setEquiposExpandidos(prev => ({ ...prev, [eq.id]: !prev[eq.id] }))}>
                    <td data-label="Código">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {busqueda && (
                          <span style={{ color: 'var(--primary)', transition: 'transform 0.2s', transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <ChevronDown size={16} />
                          </span>
                        )}
                        <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{eq.codigo || '-'}</span>
                      </div>
                    </td>
                    <td data-label="Equipo">{eq.equipo}</td>
                    <td data-label="Marca">{eq.marca}</td>
                    <td data-label="Modelo">{eq.modelo}</td>
                    <td data-label="Serie">{eq.serie}</td>
                    <td data-label="Cliente">{eq.cliente_codigo ? `${eq.cliente_codigo} - ${eq.cliente_nombre}` : '-'}</td>
                    <td data-label="Acciones" onClick={(e) => e.stopPropagation()}>
                      <div className="action-buttons">
                        <button className="table-btn edit-btn" onClick={() => editarEquipo(eq)}>
                          <Edit size={14} /> Editar
                        </button>
                        <button className="table-btn delete-btn" onClick={() => eliminarEquipo(eq.id)}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  {busqueda && expandido && (
                    <tr key={`${eq.id}-detalle`}>
                      <td colSpan={7} style={{ padding: 0, border: 'none' }}>
                        <div style={{ padding: '16px 24px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                            <div>
                              <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Package size={16} /> Detalles Técnicos
                              </h4>
                              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                                <strong>Contador:</strong> {eq.contador_pag || 0} págs
                              </p>
                              <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                                <strong>Nivel Tintas:</strong> {eq.nivel_tintas || '-'}
                              </p>
                            </div>
                            {insumosEquipo.length > 0 && (
                              <div>
                                <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Package size={16} /> Insumos ({insumosEquipo.length})
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {insumosEquipo.map((ins, idx) => (
                                    <span key={idx} className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                                      {ins}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {eq.averia && (
                              <div style={{ gridColumn: '1 / -1' }}>
                                <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Package size={16} /> Avería/Incidencia
                                </h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                  {eq.averia}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="cards-table">
        {equiposPagina.map((eq) => (
          <div key={eq.id} className="data-card">
            <div className="data-card-header">
              <strong>{eq.codigo || eq.equipo}</strong>
              <span className="badge badge-info">{eq.marca} {eq.modelo}</span>
            </div>
            <div className="data-card-row">
              <span className="data-card-label">Equipo</span>
              <span className="data-card-value">{eq.equipo}</span>
            </div>
            <div className="data-card-row">
              <span className="data-card-label">Serie</span>
              <span className="data-card-value">{eq.serie || '-'}</span>
            </div>
            <div className="data-card-row">
              <span className="data-card-label">Cliente</span>
              <span className="data-card-value">{eq.cliente_nombre || '-'}</span>
            </div>
            {eq.averia && (
              <div className="data-card-row">
                <span className="data-card-label">Avería</span>
                <span className="data-card-value">{eq.averia}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button className="table-btn edit-btn" onClick={() => editarEquipo(eq)} style={{ flex: 1, justifyContent: 'center' }}>
                <Edit size={14} /> Editar
              </button>
              <button className="table-btn delete-btn" onClick={() => eliminarEquipo(eq.id)} style={{ flex: 1, justifyContent: 'center' }}>
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {equiposFiltrados.length === 0 && (
        <div className="empty-state">
          <Package size={48} />
          <p>No hay equipos que coincidan con la búsqueda</p>
        </div>
      )}

      {totalPaginas > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Mostrando {indiceInicio + 1}-{Math.min(indiceInicio + equiposPorPagina, equiposFiltrados.length)} de {equiposFiltrados.length} equipos
          </div>
          <div className="pagination-controls">
            <button
              className="page-btn-nav"
              onClick={() => setPaginaActual(paginaActual - 1)}
              disabled={paginaActual === 1}
            >
              ‹
            </button>
            <span className="page-numbers-desktop">
              {[...Array(totalPaginas)].map((_, i) => {
                const numero = i + 1;
                return (
                  <button
                    key={numero}
                    onClick={() => setPaginaActual(numero)}
                    className={paginaActual === numero ? 'active' : ''}
                  >
                    {numero}
                  </button>
                );
              })}
            </span>
            <button
              className="page-btn-nav"
              onClick={() => setPaginaActual(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div></>
  );
}

export default Equipos;
