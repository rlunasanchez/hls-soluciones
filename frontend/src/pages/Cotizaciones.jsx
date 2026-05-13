import { useNavigate } from "react-router-dom";
import { FileSpreadsheet, Package, Users, UserCog, LogOut, FileText, ClipboardList, ShoppingCart, Home } from "lucide-react";

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
      <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
        <div className="header-left">
          <h1 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileSpreadsheet size={28} /> Cotizaciones
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
          <button onClick={() => navigate("/orden-trabajo")} className="logout-btn" style={{ background: '#6366F1', color: 'white' }}>
            <ClipboardList size={18} />
            <span className="btn-label">Orden de Trabajo</span>
          </button>
          <button onClick={() => navigate("/informes")} className="logout-btn" style={{ background: '#EA580C', color: 'white' }}>
            <FileText size={18} />
            <span className="btn-label">Informes Técnicos</span>
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

      {/* Contenido principal */}
      <div className="page-content">
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: 'var(--shadow)',
          padding: 'clamp(20px, 4vw, 40px)',
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
