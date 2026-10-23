import { useNavigate } from "react-router-dom";
import { Package, Users, Contact, MapPin, UserCog, FileText, FileSpreadsheet, ClipboardList, Home as HomeIcon, LogOut, ShoppingCart } from "lucide-react";
import { cerrarSesion } from "../utils/helpers";

// Módulos de la pantalla de inicio: color del icono y color suave del círculo (mismos del menú superior)
const menuItems = [
  { title: "Clientes", icon: Users, path: "/clientes", desc: "Mantenedor de clientes", color: "var(--primary)", fondo: "var(--primary-light)" },
  { title: "Contactos", icon: Contact, path: "/contactos", desc: "Mantenedor de contactos", color: "#7C3AED", fondo: "#EDE9FE" },
  { title: "Direcciones", icon: MapPin, path: "/direcciones", desc: "Mantenedor de direcciones", color: "#0891B2", fondo: "#CFFAFE" },
  { title: "Equipos", icon: Package, path: "/equipos", desc: "Mantenedor de equipos técnicos", color: "var(--success)", fondo: "var(--success-light)" },
  { title: "Orden de Trabajo", icon: ClipboardList, path: "/orden-trabajo", desc: "Crear y gestionar órdenes de trabajo", color: "var(--warning)", fondo: "var(--warning-light)" },
  { title: "Informes Técnicos", icon: FileText, path: "/informes", desc: "Mantenedor de informes técnicos", color: "#EA580C", fondo: "#FFEDD5" },
  { title: "Cotizaciones", icon: FileSpreadsheet, path: "/cotizaciones", desc: "Mantenedor de cotizaciones", color: "#DB2777", fondo: "#FCE7F3" },
  { title: "Orden de Compra", icon: ShoppingCart, path: "/orden-compra", desc: "Gestión de órdenes de compra", color: "#1E40AF", fondo: "#E0F2FE" },
];

function Home() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px' }}>
        <div className="header-left" style={{ flexBasis: 'auto' }}>
          <h1 style={{ color: 'white' }}><HomeIcon size={28} /> HLS Soluciones</h1>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate("/usuarios")} className="logout-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <UserCog size={18} />
            <span className="btn-label">Usuarios</span>
          </button>
          <button onClick={cerrarSesion} className="logout-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <LogOut size={18} />
            <span className="btn-label">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <div className="home-grid">
        {menuItems.map((item) => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") navigate(item.path); }}
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: 'var(--shadow)',
              padding: '16px 14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'center',
              borderTop: `3px solid ${item.color}`
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
            }}
          >
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: item.fondo,
              color: item.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <item.icon size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>{item.title}</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.3 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
