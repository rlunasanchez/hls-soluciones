import { Contact, MapPin, Home, Users, Package, ClipboardList, FileText, FileSpreadsheet, ShoppingCart, UserCog, LogOut } from "lucide-react";

function HeaderContacto({ navigate, onLogout }) {
  return (
    <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
      <div className="header-left">
        <h1 style={{ color: 'white' }}><Contact size={28} /> Mantenedor de Contactos</h1>
      </div>
      <div className="nav-buttons" style={{ gap: '10px' }}>
        <button onClick={() => navigate("/home")} className="logout-btn" style={{ background: 'var(--gradient)', color: 'white' }}>
          <Home size={18} /><span className="btn-label">Inicio</span>
        </button>
        <button onClick={() => navigate("/clientes")} className="logout-btn" style={{ background: 'var(--primary)', color: 'white' }}>
          <Users size={18} /><span className="btn-label">Clientes</span>
        </button>
        <button onClick={() => navigate("/direcciones")} className="logout-btn" style={{ background: '#0891B2', color: 'white' }}>
          <MapPin size={18} /><span className="btn-label">Direcciones</span>
        </button>
        <button onClick={() => navigate("/equipos")} className="logout-btn" style={{ background: 'var(--success)', color: 'white' }}>
          <Package size={18} /><span className="btn-label">Equipos</span>
        </button>
        <button onClick={() => navigate("/orden-trabajo")} className="logout-btn" style={{ background: 'var(--warning)', color: 'white' }}>
          <ClipboardList size={18} /><span className="btn-label">Orden de Trabajo</span>
        </button>
        <button onClick={() => navigate("/informes")} className="logout-btn" style={{ background: '#EA580C', color: 'white' }}>
          <FileText size={18} /><span className="btn-label">Informes Técnicos</span>
        </button>
        <button onClick={() => navigate("/cotizaciones")} className="logout-btn" style={{ background: '#DB2777', color: 'white' }}>
          <FileSpreadsheet size={18} /><span className="btn-label">Cotizaciones</span>
        </button>
        <button onClick={() => navigate("/orden-compra")} className="logout-btn" style={{ background: '#1E40AF', color: 'white' }}>
          <ShoppingCart size={18} /><span className="btn-label">Orden de Compra</span>
        </button>
        <button onClick={() => navigate("/usuarios")} className="logout-btn" style={{ background: '#0D9488', color: 'white' }}>
          <UserCog size={18} /><span className="btn-label">Usuarios</span>
        </button>
        <button onClick={onLogout} className="logout-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
          <LogOut size={18} /><span className="btn-label">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export default HeaderContacto;
