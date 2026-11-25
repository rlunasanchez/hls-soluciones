import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { MENU_MODULOS } from "../../utils/menuModulos";
import { cerrarSesion } from "../../utils/helpers";

// Encabezado de todas las pantallas de módulo: título con su icono y el menú del sistema (utils/menuModulos.js)
// sin el botón de la pantalla actual, más Cerrar Sesión. Reemplaza a los siete Header* que había, todos iguales.
function HeaderModulo({ titulo, Icono, onLogout = cerrarSesion }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="header" style={{ background: "var(--gradient)", padding: "20px 32px", flexDirection: "row", alignItems: "center", gap: "16px" }}>
      <div className="header-left">
        <h1 style={{ color: "white" }}><Icono size={28} /> {titulo}</h1>
      </div>
      <div className="nav-buttons" style={{ gap: "10px" }}>
        {MENU_MODULOS.filter((item) => item.path !== pathname).map(({ label, path, Icono: IconoItem, color }) => (
          <button key={path} onClick={() => navigate(path)} className="logout-btn" style={{ background: color, color: "white" }}>
            <IconoItem size={18} />
            <span className="btn-label">{label}</span>
          </button>
        ))}
        <button onClick={onLogout} className="logout-btn" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
          <LogOut size={18} />
          <span className="btn-label">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export default HeaderModulo;
