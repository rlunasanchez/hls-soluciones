import { ClipboardList, Home, Users, Package, FileText, FileSpreadsheet, ShoppingCart, UserCog, LogOut } from "lucide-react";

function HeaderOrdenTrabajo({ navItems, onLogout }) {
  return (
    <div className="header-orden">
      <div className="header-left">
        <h1><ClipboardList size={28} /> Orden de Trabajo</h1>
      </div>
      <div className="nav-buttons">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={item.onClick}
            className="nav-btn"
            style={{ background: item.color }}
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

export default HeaderOrdenTrabajo;
