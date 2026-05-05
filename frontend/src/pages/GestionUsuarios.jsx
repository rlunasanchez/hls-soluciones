import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Plus, Save, Trash2, 
  ToggleLeft, ToggleRight, LogOut, ArrowLeft,
  Key, Lock, Edit, Package, Home as HomeIcon, UserCog, FileText, FileSpreadsheet, ClipboardList, X
} from "lucide-react";
import api from "../services/api";

function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  
  const [nuevoUsuario, setNuevoUsuario] = useState({
    usuario: "",
    password: "",
    rol: "tecnico",
    email: ""
  });

  const [cambioPassword, setCambioPassword] = useState({
    passwordActual: "",
    nuevaPassword: "",
    confirmarPassword: ""
  });

  const token = localStorage.getItem("token");
  let usuarioActual = "Usuario";
  let rol = "tecnico";

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      usuarioActual = payload.usuario;
      rol = payload.rol || "tecnico";
    } catch {
      usuarioActual = "Usuario";
    }
  }

  const fetchUsuarios = async () => {
    try {
      const res = await api.get("/api/auth/usuarios");
      setUsuarios(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const crearUsuario = async (e) => {
    e.preventDefault();
    try {
      if (usuarioEditando) {
        await api.put(`/api/auth/actualizar-usuario/${usuarioEditando.id}`, {
          usuario: nuevoUsuario.usuario,
          rol: nuevoUsuario.rol,
          email: nuevoUsuario.email
        });
        alert("Usuario actualizado correctamente");
      } else {
        await api.post("/api/auth/registrar", nuevoUsuario);
        alert("Usuario creado correctamente");
      }
      setNuevoUsuario({ usuario: "", password: "", rol: "tecnico", email: "" });
      setUsuarioEditando(null);
      setMostrarFormulario(false);
      fetchUsuarios();
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar usuario");
    }
  };

  const editarUsuario = (usuario) => {
    setUsuarioEditando(usuario);
    setNuevoUsuario({
      usuario: usuario.usuario,
      password: "",
      rol: usuario.rol,
      email: usuario.email || ""
    });
    setMostrarFormulario(true);
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    try {
      await api.delete(`/api/auth/eliminar-usuario/${id}`);
      fetchUsuarios();
    } catch (err) {
      alert("Error al eliminar usuario");
    }
  };

  const toggleActivo = async (id, activo) => {
    try {
      await api.put(`/api/auth/activar-usuario/${id}`, { activo: !activo });
      fetchUsuarios();
    } catch (err) {
      alert("Error al cambiar estado");
    }
  };

  const resetearPassword = async (id) => {
    const nuevaPassword = prompt("Ingrese la nueva contraseña:");
    if (!nuevaPassword) return;
    try {
      await api.put(`/api/auth/resetear-password/${id}`, { nuevaPassword });
      alert("Password restablecida correctamente");
    } catch (err) {
      alert("Error al restablecer password");
    }
  };

  const cambiarMiPassword = async (e) => {
    e.preventDefault();
    if (cambioPassword.nuevaPassword !== cambioPassword.confirmarPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    try {
      await api.put("/api/auth/cambiar-password", {
        usuario: usuarioActual,
        passwordActual: cambioPassword.passwordActual,
        nuevaPassword: cambioPassword.nuevaPassword
      });
      alert("Contraseña actualizada correctamente");
      setCambioPassword({ passwordActual: "", nuevaPassword: "", confirmarPassword: "" });
      setMostrarCambioPassword(false);
    } catch (err) {
      alert(err.response?.data?.msg || "Error al cambiar contraseña");
    }
  };

  if (mostrarCambioPassword) {
    return (
      <div className="container">
        <div className="form-container">
          <div className="form-header">
            <h2><Lock size={24} /> Cambiar Mi Contraseña</h2>
          </div>
          <form onSubmit={cambiarMiPassword} className="form-grid">
            <div className="form-group full-width">
              <label>Contraseña Actual</label>
              <input
                type="password"
                value={cambioPassword.passwordActual}
                onChange={(e) => setCambioPassword({...cambioPassword, passwordActual: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Nueva Contraseña</label>
              <input
                type="password"
                value={cambioPassword.nuevaPassword}
                onChange={(e) => setCambioPassword({...cambioPassword, nuevaPassword: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirmar Contraseña</label>
              <input
                type="password"
                value={cambioPassword.confirmarPassword}
                onChange={(e) => setCambioPassword({...cambioPassword, confirmarPassword: e.target.value})}
                required
              />
            </div>
            <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '20px', marginTop: '8px' }}>
              <button type="button" className="cancel-btn" onClick={() => setMostrarCambioPassword(false)}>
                <ArrowLeft size={20} /> Cancelar
              </button>
              <button type="submit" className="main-btn">
                <Save size={20} /> Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (mostrarFormulario) {
    return (
      <div className="container">
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gradient)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <Plus size={28} />
                {usuarioEditando ? "Editar Usuario" : "Crear Usuario"}
              </h2>
              <button 
                type="button" 
                onClick={() => {
                  setMostrarFormulario(false);
                  setUsuarioEditando(null);
                  setNuevoUsuario({ usuario: "", password: "", rol: "tecnico", email: "" });
                }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: 'white' }}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={crearUsuario} style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div style={{ padding: '20px', background: 'var(--primary-light)', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '16px' }}>Datos del Usuario</h3>
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Usuario</label>
                    <input
                      placeholder="Nombre de usuario"
                      value={nuevoUsuario.usuario}
                      onChange={(e) => setNuevoUsuario({...nuevoUsuario, usuario: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Correo</label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={nuevoUsuario.email}
                      onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                    />
                  </div>
                </div>
                {!usuarioEditando && (
                  <div className="form-row-2" style={{ marginTop: '16px' }}>
                    <div className="form-group">
                      <label>Contraseña</label>
                      <input
                        type="password"
                        placeholder="Contraseña"
                        value={nuevoUsuario.password}
                        onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Rol</label>
                      <select
                        value={nuevoUsuario.rol}
                        onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
                      >
                        <option value="tecnico">Técnico</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                )}
                {usuarioEditando && (
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>Rol</label>
                    <select
                      value={nuevoUsuario.rol}
                      onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})}
                    >
                      <option value="tecnico">Técnico</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="cancel-btn" onClick={() => {
                  setMostrarFormulario(false);
                  setUsuarioEditando(null);
                  setNuevoUsuario({ usuario: "", password: "", rol: "tecnico", email: "" });
                }}>
                  <X size={20} /> Cancelar
                </button>
                <button type="submit" className="main-btn">
                  <Save size={20} /> {usuarioEditando ? "Actualizar" : "Crear Usuario"}
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
          <h1 style={{ color: 'white' }}><Users size={28} /> {rol === 'admin' ? 'Gestión de Usuarios' : 'Mi Cuenta'}</h1>
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
          <button onClick={() => navigate("/clientes")} className="logout-btn" style={{ background: 'var(--warning)', color: 'white' }}>
            <Users size={18} />
            <span className="btn-label">Clientes</span>
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
          <button onClick={cerrarSesion} className="logout-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <LogOut size={18} />
            <span className="btn-label">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {rol === 'admin' && (
        <div className="actions-bar" style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
          <button onClick={() => setMostrarFormulario(true)} className="main-btn">
            <Plus size={20} />
            Nuevo Usuario
          </button>
          <button onClick={() => setMostrarCambioPassword(true)} className="secondary-btn">
            <Key size={20} />
            Cambiar Password
          </button>
        </div>
      )}

      {rol === 'admin' ? (
        <>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td data-label="ID">{u.id}</td>
                  <td data-label="Usuario"><strong>{u.usuario}</strong></td>
                  <td data-label="Correo">{u.email || '-'}</td>
                  <td data-label="Rol">
                    <span className={`badge ${u.rol === 'admin' ? 'badge-primary' : 'badge-info'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td data-label="Estado">
                    <button
                      className="table-btn"
                      onClick={() => toggleActivo(u.id, u.activo)}
                      style={{ background: u.activo ? 'var(--success-light)' : 'var(--danger-light)', color: u.activo ? 'var(--success)' : 'var(--danger)' }}
                    >
                      {u.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td data-label="Fecha">{u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleDateString("es-CL") : '-'}</td>
                  <td data-label="Acciones">
                    <div className="action-buttons">
                      {rol === 'admin' && (
                        <>
                          <button className="table-btn edit-btn" onClick={() => editarUsuario(u)}>
                            <Edit size={14} />
                            Editar
                          </button>
                          <button className="table-btn" onClick={() => resetearPassword(u.id)} style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                            <Key size={14} />
                            Reset
                          </button>
                          {u.usuario !== 'admin' && (
                            <button className="table-btn delete-btn" onClick={() => eliminarUsuario(u.id)}>
                              <Trash2 size={14} />
                              Eliminar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista de tarjetas para móvil */}
        <div className="cards-table">
          {usuarios.map((u) => (
            <div key={u.id} className="data-card">
              <div className="data-card-header">
                <strong>{u.usuario}</strong>
                <span className={`badge ${u.rol === 'admin' ? 'badge-primary' : 'badge-info'}`}>
                  {u.rol}
                </span>
              </div>
              <div className="data-card-row">
                <span className="data-card-label">Correo</span>
                <span className="data-card-value">{u.email || '-'}</span>
              </div>
              <div className="data-card-row">
                <span className="data-card-label">Estado</span>
                <span className="data-card-value" style={{ color: u.activo ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="data-card-row">
                <span className="data-card-label">Creado</span>
                <span className="data-card-value">{u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleDateString("es-CL") : '-'}</span>
              </div>
              {rol === 'admin' && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <button className="table-btn edit-btn" onClick={() => editarUsuario(u)} style={{ flex: 1, justifyContent: 'center', minWidth: '70px' }}>
                    <Edit size={14} /> Editar
                  </button>
                  <button className="table-btn" onClick={() => toggleActivo(u.id, u.activo)} style={{ background: u.activo ? 'var(--success-light)' : 'var(--danger-light)', color: u.activo ? 'var(--success)' : 'var(--danger)', flex: 1, justifyContent: 'center', minWidth: '80px' }}>
                    {u.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </button>
                  <button className="table-btn" onClick={() => resetearPassword(u.id)} style={{ background: 'var(--warning-light)', color: 'var(--warning)', flex: 1, justifyContent: 'center', minWidth: '70px' }}>
                    <Key size={14} /> Reset
                  </button>
                  {u.usuario !== 'admin' && (
                    <button className="table-btn delete-btn" onClick={() => eliminarUsuario(u.id)} style={{ flex: 1, justifyContent: 'center', minWidth: '80px' }}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      ) : (
        <div className="table-container" style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Información de tu cuenta</h2>
          <p style={{ fontSize: '1.1rem', marginTop: '20px' }}>
            <strong>Usuario:</strong> {usuarioActual}
          </p>
          <p style={{ fontSize: '1.1rem' }}>
            <strong>Rol:</strong> {rol}
          </p>
          <p style={{ color: 'var(--text-muted)', marginTop: '20px' }}>
            Contacta al administrador si necesitas cambios en tu cuenta.
          </p>
        </div>
      )}
    </div>
  );
}

export default GestionUsuarios;