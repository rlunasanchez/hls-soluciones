import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet, Home, Package, Users, UserCog, LogOut, FileText, ClipboardList } from "lucide-react";

function Cotizaciones() {
  const navigate = useNavigate();

  const volverHome = () => {
    navigate("/home");
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
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
            <FileSpreadsheet size={28} /> Cotizaciones
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
          <button onClick={() => navigate("/orden-trabajo")} className="logout-btn" style={{ background: '#6366F1', color: 'white' }}>
            <ClipboardList size={18} />
            Orden Trabajo
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
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: 'var(--shadow)',
          padding: '40px',
          textAlign: 'center'
        }}>
          <FileSpreadsheet size={64} style={{ color: '#EC4899', marginBottom: '24px' }} />
          <h2 style={{ color: 'var(--text)', marginBottom: '16px' }}>
            Mantenedor de Cotizaciones
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            Aquí se gestionarán las cotizaciones del sistema.
          </p>
          
          {/* Aquí irán los campos que definirás después */}
          <div style={{ 
            border: '2px dashed var(--border)', 
            borderRadius: '12px', 
            padding: '40px',
            color: 'var(--text-muted)'
          }}>
            <p>Campos del mantenedor (se agregarán después)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cotizaciones;
