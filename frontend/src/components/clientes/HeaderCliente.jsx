import { useNavigate } from "react-router-dom";
import { Home, Users, Package, FileText, FileSpreadsheet, ClipboardList, ShoppingCart, UserCog, LogOut } from "lucide-react";

function HeaderCliente({ usuarioActual, onLogout }) {
  const navigate = useNavigate();

  const navItems = [
    { label: "Inicio", path: "/home", icon: Home },
    { label: "Equipos", path: "/equipos", icon: Package },
    { label: "Orden de Trabajo", path: "/orden-trabajo", icon: ClipboardList },
    { label: "Informes Técnicos", path: "/informes", icon: FileText },
    { label: "Cotizaciones", path: "/cotizaciones", icon: FileSpreadsheet },
    { label: "Orden de Compra", path: "/orden-compra", icon: ShoppingCart },
    { label: "Usuarios", path: "/usuarios", icon: UserCog },
  ];

  const colors = [
    "var(--primary)", "var(--success)", "#6366F1", "#EA580C", "#DB2777", "#8B5CF6", "#0D9488"
  ];

  return (
    <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
      <div className="header-left">
        <h1 style={{ color: 'white' }}><Users size={28} /> Mantenedor de Clientes</h1>
      </div>
      <div className="nav-buttons" style={{ gap: '10px' }}>
        {navItems.map((item, i) => (
          <button key={item.path} onClick={() => navigate(item.path)} className="logout-btn" style={{ background: colors[i], color: 'white' }}>
            <item.icon size={18} />
            <span className="btn-label">{item.label}</span>
          </button>
        ))}
        <button onClick={onLogout} className="logout-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
          <LogOut size={18} />
          <span className="btn-label">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export default HeaderCliente;