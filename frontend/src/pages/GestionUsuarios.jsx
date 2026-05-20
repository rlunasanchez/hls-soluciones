import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Key, Edit, ToggleLeft, ToggleRight, Trash2
} from "lucide-react";
import api from "../services/api";
import HeaderUsuario from "../components/usuarios/HeaderUsuario";
import UsuarioFormulario from "../components/usuarios/UsuarioFormulario";
import CambioPasswordForm from "../components/usuarios/CambioPasswordForm";

function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

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

  const crearUsuario = async (nuevoUsuario, id) => {
    try {
      if (id) {
        await api.put(`/api/auth/actualizar-usuario/${id}`, {
          usuario: nuevoUsuario.usuario,
          rol: nuevoUsuario.rol,
          email: nuevoUsuario.email
        });
        alert("Usuario actualizado correctamente");
      } else {
        await api.post("/api/auth/registrar", nuevoUsuario);
        alert("Usuario creado correctamente");
      }
      setMostrarFormulario(false);
      setUsuarioEditando(null);
      fetchUsuarios();
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar usuario");
    }
  };

  const editarUsuario = (usuario) => {
    setUsuarioEditando(usuario);
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

  const cambiarMiPassword = async (data) => {
    try {
      await api.put("/api/auth/cambiar-password", {
        usuario: usuarioActual,
        passwordActual: data.passwordActual,
        nuevaPassword: data.nuevaPassword
      });
      alert("Contraseña actualizada correctamente");
      setMostrarCambioPassword(false);
    } catch (err) {
      alert(err.response?.data?.msg || "Error al cambiar contraseña");
    }
  };

  if (mostrarCambioPassword) {
    return (
      <CambioPasswordForm
        onSave={cambiarMiPassword}
        onCancel={() => setMostrarCambioPassword(false)}
      />
    );
  }

  if (mostrarFormulario) {
    return (
      <UsuarioFormulario
        usuarioEditando={usuarioEditando}
        onSave={crearUsuario}
        onCancel={() => { setMostrarFormulario(false); setUsuarioEditando(null); }}
      />
    );
  }

  return (
    <div className="container">
      <HeaderUsuario navigate={navigate} onLogout={cerrarSesion} rol={rol} />

      {rol === 'admin' && (
        <div className="actions-bar" style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
          <button onClick={() => setMostrarFormulario(true)} className="main-btn">
            <Plus size={20} /> Nuevo Usuario
          </button>
          <button onClick={() => setMostrarCambioPassword(true)} className="secondary-btn">
            <Key size={20} /> Cambiar Password
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
                      <span className={`badge ${u.rol === 'admin' ? 'badge-primary' : 'badge-info'}`}>{u.rol}</span>
                    </td>
                    <td data-label="Estado">
                      <button className="table-btn" onClick={() => toggleActivo(u.id, u.activo)}
                        style={{ background: u.activo ? 'var(--success-light)' : 'var(--danger-light)', color: u.activo ? 'var(--success)' : 'var(--danger)' }}>
                        {u.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td data-label="Fecha">{u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleDateString("es-CL") : '-'}</td>
                    <td data-label="Acciones">
                      <div className="action-buttons">
                        <button className="table-btn edit-btn" onClick={() => editarUsuario(u)}>
                          <Edit size={14} /> Editar
                        </button>
                        <button className="table-btn" onClick={() => resetearPassword(u.id)}
                          style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                          <Key size={14} /> Reset
                        </button>
                        {u.usuario !== 'admin' && (
                          <button className="table-btn delete-btn" onClick={() => eliminarUsuario(u.id)}>
                            <Trash2 size={14} /> Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cards-table">
            {usuarios.map((u) => (
              <div key={u.id} className="data-card">
                <div className="data-card-header">
                  <strong>{u.usuario}</strong>
                  <span className={`badge ${u.rol === 'admin' ? 'badge-primary' : 'badge-info'}`}>{u.rol}</span>
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
                <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                  <button className="table-btn edit-btn" onClick={() => editarUsuario(u)} style={{ flex: 1, justifyContent: 'center', minWidth: '70px' }}>
                    <Edit size={14} /> Editar
                  </button>
                  <button className="table-btn" onClick={() => toggleActivo(u.id, u.activo)}
                    style={{ background: u.activo ? 'var(--success-light)' : 'var(--danger-light)', color: u.activo ? 'var(--success)' : 'var(--danger)', flex: 1, justifyContent: 'center', minWidth: '80px' }}>
                    {u.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </button>
                  <button className="table-btn" onClick={() => resetearPassword(u.id)}
                    style={{ background: 'var(--warning-light)', color: 'var(--warning)', flex: 1, justifyContent: 'center', minWidth: '70px' }}>
                    <Key size={14} /> Reset
                  </button>
                  {u.usuario !== 'admin' && (
                    <button className="table-btn delete-btn" onClick={() => eliminarUsuario(u.id)} style={{ flex: 1, justifyContent: 'center', minWidth: '80px' }}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>
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
