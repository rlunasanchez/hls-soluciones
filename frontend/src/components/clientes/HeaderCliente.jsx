import { useNavigate } from "react-router-dom";
import { Home, UserCog, FileText, FileSpreadsheet, ClipboardList, ShoppingCart, Package, LogOut, Users } from "lucide-react";

function HeaderCliente({ usuarioActual, onLogout }) {
  const navigate = useNavigate();

  const navItems = [
    { label: "Inicio", path: "/home", icon: Home, bg: "var(--primary)" },
    { label: "Equipos", path: "/equipos", icon: Package, bg: "var(--success)" },
    { label: "Orden de Trabajo", path: "/orden-trabajo", icon: ClipboardList, bg: "#6366F1" },
    { label: "Informes Técnicos", path: "/informes", icon: FileText, bg: "#EA580C" },
    { label: "Cotizaciones", path: "/cotizaciones", icon: FileSpreadsheet, bg: "#DB2777" },
    { label: "Orden de Compra", path: "/orden-compra", icon: ShoppingCart, bg: "#8B5CF6" },
    { label: "Usuarios", path: "/usuarios", icon: UserCog, bg: "#0D9488" },
  ];

  return (
    <div className="header-cliente">
      <div className="header-left">
        <h1>
          <Users size={28} /> Mantenedor de Clientes
        </h1>
        <span className="usuario-badge">{usuarioActual}</span>
      </div>
      <div className="nav-buttons">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="nav-btn"
            style={{ background: item.bg }}
          >
            <item.icon size={18} />
            <span className="btn-label">{item.label}</span>
          </button>
        ))}
        <button onClick={onLogout} className="nav-btn nav-btn-logout">
          <LogOut size={18} />
          <span className="btn-label">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export default HeaderCliente;
