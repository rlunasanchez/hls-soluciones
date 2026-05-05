import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Save, Trash2, Edit, ArrowLeft, LogOut, Search, ChevronDown, ChevronUp, Home as HomeIcon, Package, UserCog, FileText, FileSpreadsheet, ClipboardList, X } from "lucide-react";
import api from "../services/api";

function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRut, setFiltroRut] = useState("");
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const clientesPorPagina = 5;

  const [nuevoCliente, setNuevoCliente] = useState({
    razon_social: "",
    giro: "",
    rut: "",
    direccion: "",
    ciudad: "",
    comuna: "",
    telefono: "",
    contacto_nombre: "",
    contacto_email: "",
    contacto_fono: "",
    contacto_cargo: "",
    contacto_direccion: "",
    direcciones: []
  });

  const [sucursales, setSucursales] = useState([
    { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
    { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
    { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
    { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
    { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" }
  ]);
  const [sucursalesVisibles, setSucursalesVisibles] = useState(1);

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

  const fetchClientes = async () => {
    try {
      const res = await api.get("/api/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    const texto = busqueda.toLowerCase();
    const matchBusqueda = !texto ||
      c.razon_social?.toLowerCase().includes(texto) ||
      c.contacto_nombre?.toLowerCase().includes(texto);
    const matchRut = !filtroRut || c.rut?.toLowerCase().includes(filtroRut.toLowerCase());
    return matchBusqueda && matchRut;
  });

  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
  const indiceInicio = (paginaActual - 1) * clientesPorPagina;
  const clientesPagina = clientesFiltrados.slice(indiceInicio, indiceInicio + clientesPorPagina);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroRut]);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    const dirs = sucursales.filter(s => s.direccion.trim() !== "");
    try {
      if (clienteEditando) {
        await api.put(`/api/clientes/${clienteEditando.id}`, { ...nuevoCliente, direcciones: dirs });
        alert("Cliente actualizado");
      } else {
        await api.post("/api/clientes", { ...nuevoCliente, direcciones: dirs });
        alert("Cliente creado");
      }
      setNuevoCliente({
        razon_social: "", giro: "", rut: "", direccion: "", ciudad: "", comuna: "", telefono: "",
        contacto_nombre: "", contacto_email: "", contacto_fono: "", contacto_cargo: "", contacto_direccion: "", direcciones: []
      });
      setClienteEditando(null);
      setMostrarFormulario(false);
      setSucursales([
        { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
        { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
        { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
        { tipo_direccion: "", direccion: "", fono: "", ciudad: "",coma: "" },
        { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" }
      ]);
      setSucursalesVisibles(1);
      fetchClientes();
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar");
    }
  };

  const editarCliente = (c) => {
    setSucursales([
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", coma: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" }
    ]);
    setClienteEditando(c);
    let dirs = [];
    if (c.direcciones) {
      dirs = c.direcciones.split(";;").map(d => {
        const parts = d.split("|");
        return { tipo_direccion: parts[0], direccion: parts[1], fono: parts[2], ciudad: parts[3], comuna: parts[4] };
      }).filter(d => d.tipo_direccion);
      if (dirs.length > 0) {
        while (dirs.length < 5) {
          dirs.push({ tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" });
        }
        setSucursales(dirs);
      }
    }
    setSucursalesVisibles(dirs.filter(s => s.direccion).length || 1);
    setNuevoCliente({
      razon_social: c.razon_social,
      giro: c.giro || "",
      rut: c.rut || "",
      direccion: c.direccion || "",
      ciudad: c.ciudad || "",
      comuna: c.comuna || "",
      telefono: c.telefono || "",
      contacto_nombre: c.contacto_nombre || "",
      contacto_email: c.contacto_email || "",
      contacto_fono: c.contacto_fono || "",
      contacto_cargo: c.contacto_cargo || "",
      contacto_direccion: c.contacto_direccion || "",
      direcciones: dirs
    });
    setMostrarFormulario(true);
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm("¿Eliminar este cliente?")) return;
    try {
      await api.delete(`/api/clientes/${id}`);
      fetchClientes();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const actualizarSucursal = (idx, campo, valor) => {
    const nuevas = [...sucursales];
    nuevas[idx][campo] = valor;
    setSucursales(nuevas);
  };

  if (mostrarFormulario) {
    return (
      <div className="container">
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gradient)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <Users size={28} />
                {clienteEditando ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button 
                type="button" 
                onClick={() => {
                  setMostrarFormulario(false);
                  setClienteEditando(null);
                  setMostrarDirecciones(false);
                  setNuevoCliente({
                    razon_social: "", giro: "", rut: "", direccion: "", ciudad: "", comuna: "", telefono: "",
                    contacto_nombre: "", contacto_email: "", contacto_fono: "", contacto_cargo: "", contacto_direccion: "", direcciones: []
                  });
                }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: 'white' }}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={guardarCliente} style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div style={{ padding: '20px', background: 'var(--primary-light)', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '16px' }}>Datos de la Empresa</h3>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Razón Social *</label>
                    <input
                      placeholder="Razón social"
                      value={nuevoCliente.razon_social}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Giro</label>
                    <input
                      placeholder="Giro"
                      value={nuevoCliente.giro}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, giro: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>RUT</label>
                    <input
                      placeholder="RUT"
                      value={nuevoCliente.rut}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, rut: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row-3" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Dirección</label>
                    <input
                      placeholder="Dirección"
                      value={nuevoCliente.direccion}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      placeholder="Ciudad"
                      value={nuevoCliente.ciudad}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Comuna</label>
                    <input
                      placeholder="Comuna"
                      value={nuevoCliente.comuna}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, comuna: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row-3" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Fono</label>
                    <input
                      placeholder="Fono"
                      value={nuevoCliente.telefono}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px', background: 'var(--success-light)', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--success)', marginBottom: '16px', fontSize: '16px' }}>Datos del Contacto</h3>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Nombre Contacto</label>
                    <input
                      placeholder="Nombre"
                      value={nuevoCliente.contacto_nombre}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_nombre: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={nuevoCliente.contacto_email}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fono</label>
                    <input
                      placeholder="Fono"
                      value={nuevoCliente.contacto_fono}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_fono: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row-3" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Cargo</label>
                    <input
                      placeholder="Cargo"
                      value={nuevoCliente.contacto_cargo}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_cargo: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Dirección Contacto</label>
                    <input
                      placeholder="Dirección"
                      value={nuevoCliente.contacto_direccion}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_direccion: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px', background: '#F1F5F9', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '16px' }}>Sucursales/Direcciones</h3>
                  {sucursalesVisibles < 5 && (
                    <button 
                      type="button" 
                      className="secondary-btn"
                      style={{ padding: '8px 16px' }}
                      onClick={() => setSucursalesVisibles(sucursalesVisibles + 1)}
                    >
                      + Agregar
                    </button>
                  )}
                </div>
                {sucursales.slice(0, sucursalesVisibles).map((suc, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '12px', padding: '12px', background: 'white', borderRadius: '8px', alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Tipo</label>
                      <select
                        value={suc.tipo_direccion}
                        onChange={(e) => actualizarSucursal(idx, 'tipo_direccion', e.target.value)}
                      >
                        <option value="">Seleccionar</option>
                        <option value="Matriz">Matriz</option>
                        <option value="Sucursal">Sucursal</option>
                        <option value="Bodega">Bodega</option>
                        <option value="Oficina">Oficina</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Dirección</label>
                      <input
                        placeholder="Dirección"
                        value={suc.direccion}
                        onChange={(e) => actualizarSucursal(idx, 'direccion', e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Fono</label>
                      <input
                        placeholder="Fono"
                        value={suc.fono}
                        onChange={(e) => actualizarSucursal(idx, 'fono', e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Ciudad</label>
                      <input
                        placeholder="Ciudad"
                        value={suc.ciudad}
                        onChange={(e) => actualizarSucursal(idx, 'ciudad', e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>Comuna</label>
                      <input
                        placeholder="Comuna"
                        value={suc.comuna}
                        onChange={(e) => actualizarSucursal(idx, 'comuna', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="delete-btn"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px' }}
                      onClick={() => {
                        const nuevas = sucursales.filter((_, i) => i !== idx);
                        while (nuevas.length < 5) {
                          nuevas.push({ tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" });
                        }
                        setSucursales(nuevas);
                        setSucursalesVisibles(Math.max(1, sucursalesVisibles - 1));
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="cancel-btn" onClick={() => {
                  setMostrarFormulario(false);
                  setClienteEditando(null);
                  setNuevoCliente({
                    razon_social: "", giro: "", rut: "", direccion: "", ciudad: "", comuna: "", telefono: "",
                    contacto_nombre: "", contacto_email: "", contacto_fono: "", contacto_cargo: "", contacto_direccion: "", direcciones: []
                  });
                }}>
                  <X size={20} /> Cancelar
                </button>
                <button type="submit" className="main-btn">
                  <Save size={20} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px' }}>
        <div className="header-left">
          <h1 style={{ color: 'white' }}><Users size={28} /> Mantenedor de Clientes</h1>
        </div>
        <div className="nav-buttons" style={{ gap: '10px' }}>
          <button onClick={() => navigate("/home")} className="logout-btn" style={{ background: 'var(--primary)', color: 'white' }}>
            <HomeIcon size={18} />
            <span className="btn-label">Inicio</span>
          </button>
          <button onClick={() => navigate("/equipos")} className="logout-btn" style={{ background: 'var(--success)', color: 'white' }}>
            <Package size={18} />
            <span className="btn-label">Equipos</span>
          </button>
          <button onClick={() => navigate("/informes")} className="logout-btn" style={{ background: '#EA580C', color: 'white' }}>
            <FileText size={18} />
            <span className="btn-label">Informes</span>
          </button>
          <button onClick={() => navigate("/cotizaciones")} className="logout-btn" style={{ background: '#DB2777', color: 'white' }}>
            <FileSpreadsheet size={18} />
            <span className="btn-label">Cotizaciones</span>
          </button>
          <button onClick={() => navigate("/orden-trabajo")} className="logout-btn" style={{ background: '#6366F1', color: 'white' }}>
            <ClipboardList size={18} />
            <span className="btn-label">Orden Trabajo</span>
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
        <div className="filters-header" onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}>
          <h3><Search size={18} /> Búsqueda</h3>
          <div className="filters-toggle">
            {filtrosExpandidos ? 'Ocultar' : 'Mostrar'}
            {filtrosExpandidos ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        {filtrosExpandidos && (
          <div className="filters-content">
            <div className="filter-group">
              <label>Razón Social</label>
              <input
                type="text"
                placeholder="Filtrar por razón social..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>RUT</label>
              <input
                type="text"
                placeholder="Filtrar por RUT..."
                value={filtroRut}
                onChange={(e) => setFiltroRut(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="table-header">
        <button onClick={() => { setMostrarFormulario(true); setMostrarDirecciones(false); setNuevoCliente({
          razon_social: "", giro: "", rut: "", direccion: "", ciudad: "", comuna: "", telefono: "",
          contacto_nombre: "", contacto_email: "", contacto_fono: "", contacto_cargo: "", contacto_direccion: "", direcciones: []
        }); }} className="main-btn">
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Razón Social</th>
              <th>RUT</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Contacto</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesPagina.map((c) => (
              <tr key={c.id}>
                <td data-label="Razón Social">{c.razon_social}</td>
                <td data-label="RUT">{c.rut}</td>
                <td data-label="Teléfono">{c.telefono}</td>
                <td data-label="Ciudad">{c.ciudad}</td>
                <td data-label="Contacto">{c.contacto_nombre}</td>
                <td data-label="Acciones">
                  <div className="action-buttons">
                    <button className="table-btn edit-btn" onClick={() => editarCliente(c)}>
                      <Edit size={14} /> Editar
                    </button>
                    <button className="table-btn delete-btn" onClick={() => eliminarCliente(c.id)}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para móvil */}
      <div className="cards-table">
        {clientesPagina.map((c) => (
          <div key={c.id} className="data-card">
            <div className="data-card-header">
              <strong>{c.razon_social}</strong>
              <span className="badge badge-primary">{c.rut}</span>
            </div>
            <div className="data-card-row">
              <span className="data-card-label">Teléfono</span>
              <span className="data-card-value">{c.telefono}</span>
            </div>
            <div className="data-card-row">
              <span className="data-card-label">Ciudad</span>
              <span className="data-card-value">{c.ciudad}</span>
            </div>
            <div className="data-card-row">
              <span className="data-card-label">Contacto</span>
              <span className="data-card-value">{c.contacto_nombre}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button className="table-btn edit-btn" onClick={() => editarCliente(c)} style={{ flex: 1, justifyContent: 'center' }}>
                <Edit size={14} /> Editar
              </button>
              <button className="table-btn delete-btn" onClick={() => eliminarCliente(c.id)} style={{ flex: 1, justifyContent: 'center' }}>
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {clientesFiltrados.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <p>No hay clientes</p>
        </div>
      )}

      {totalPaginas > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Mostrando {indiceInicio + 1}-{Math.min(indiceInicio + clientesPorPagina, clientesFiltrados.length)} de {clientesFiltrados.length} clientes
          </div>
          <div className="pagination-controls">
            <button className="page-btn-nav" onClick={() => setPaginaActual(paginaActual - 1)} disabled={paginaActual === 1}>‹</button>
            <span className="page-numbers-desktop">
              {[...Array(totalPaginas)].map((_, i) => (
                <button key={i + 1} onClick={() => setPaginaActual(i + 1)} className={paginaActual === i + 1 ? 'active' : ''}>{i + 1}</button>
              ))}
            </span>
            <button className="page-btn-nav" onClick={() => setPaginaActual(paginaActual + 1)} disabled={paginaActual === totalPaginas}>›</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;