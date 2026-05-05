import { useNavigate } from "react-router-dom";
import { Package, Users, UserCog, FileText, FileSpreadsheet, ClipboardList, Home as HomeIcon, LogOut, ChevronRight } from "lucide-react";

function Home() {
  const navigate = useNavigate();
  
  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const menuItems = [
    { title: "Equipos", icon: Package, path: "/equipos", desc: "Mantenedor de equipos técnicos" },
    { title: "Clientes", icon: Users, path: "/clientes", desc: "Mantenedor de clientes" },
    { title: "Usuarios", icon: UserCog, path: "/usuarios", desc: "Gestión de usuarios del sistema" },
    { title: "Informes Técnicos", icon: FileText, path: "/informes", desc: "Mantenedor de informes técnicos" },
    { title: "Cotizaciones", icon: FileSpreadsheet, path: "/cotizaciones", desc: "Mantenedor de cotizaciones" },
    { title: "Orden de Trabajo", icon: ClipboardList, path: "/orden-trabajo", desc: "Crear y gestionar órdenes de trabajo" },
  ];

  return (
    <div className="container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px' }}>
        <div className="header-left">
          <h1 style={{ color: 'white' }}><HomeIcon size={28} /> HLS Soluciones</h1>
        </div>
        <div className="nav-buttons">
          <button onClick={cerrarSesion} className="logout-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <LogOut size={18} />
            <span className="btn-label">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <div className="home-grid">
        {menuItems.map((item, idx) => (
          <div 
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: 'var(--shadow)',
              padding: '40px 32px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              textAlign: 'center',
              borderTop: '4px solid'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: idx === 0 ? 'var(--primary-light)' : idx === 1 ? 'var(--success-light)' : idx === 2 ? 'var(--warning-light)' : idx === 3 ? '#FFEDD5' : idx === 4 ? '#FCE7F3' : '#E0E7FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: idx === 0 ? 'var(--primary)' : idx === 1 ? 'var(--success)' : idx === 2 ? 'var(--warning)' : idx === 3 ? '#EA580C' : idx === 4 ? '#DB2777' : '#6366F1'
            }}>
              <item.icon size={40} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text)' }}>{item.title}</h2>
              <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.desc}</p>
            </div>
            <ChevronRight size={24} style={{ color: 'var(--text-muted)', marginTop: '8px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;