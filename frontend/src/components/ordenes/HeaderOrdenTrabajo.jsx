import { useNavigate } from "react-router-dom";
import {
  ClipboardList, LogOut, Home, Users, Contact, MapPin, Package, FileText, FileSpreadsheet, ShoppingCart, UserCog
} from "lucide-react";

// Menú superior: las otras 9 pantallas, mismo orden, icono y color que en el resto del sistema.
function HeaderOrdenTrabajo({ onLogout }) {
  const navigate = useNavigate();
  const navItems = [
    { label: "Inicio", icon: Home, path: "/home", color: "var(--gradient)" },
    { label: "Clientes", icon: Users, path: "/clientes", color: "var(--primary)" },
    { label: "Contactos", icon: Contact, path: "/contactos", color: "#7C3AED" },
    { label: "Direcciones", icon: MapPin, path: "/direcciones", color: "#0891B2" },
    { label: "Equipos", icon: Package, path: "/equipos", color: "var(--success)" },
    { label: "Informes Técnicos", icon: FileText, path: "/informes", color: "#EA580C" },
    { label: "Cotizaciones", icon: FileSpreadsheet, path: "/cotizaciones", color: "#DB2777" },
    { label: "Orden de Compra", icon: ShoppingCart, path: "/orden-compra", color: "#1E40AF" },
    { label: "Usuarios", icon: UserCog, path: "/usuarios", color: "#0D9488" },
  ];

  return (
    <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
      <div className="header-left">
        <h1 style={{ color: 'white' }}><ClipboardList size={28} /> Orden de Trabajo</h1>
      </div>
      <div className="nav-buttons" style={{ gap: '10px' }}>
        {navItems.map((item) => (
          <button key={item.label} onClick={() => navigate(item.path)} className="logout-btn" style={{ background: item.color, color: 'white' }}>
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

export default HeaderOrdenTrabajo;
