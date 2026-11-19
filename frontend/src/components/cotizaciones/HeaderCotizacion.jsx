import {
  FileSpreadsheet, Package, Users, Contact, MapPin, UserCog, LogOut, FileText, ClipboardList, ShoppingCart, Home
} from "lucide-react";
import { cerrarSesion } from "../../utils/helpers";

// Menú superior de Cotizaciones: enlaza a las otras pantallas (mismo orden, icono y color que el resto).
const ENLACES = [
  { ruta: "/home", texto: "Inicio", Icono: Home, fondo: "var(--gradient)" },
  { ruta: "/clientes", texto: "Clientes", Icono: Users, fondo: "var(--primary)" },
  { ruta: "/contactos", texto: "Contactos", Icono: Contact, fondo: "#7C3AED" },
  { ruta: "/direcciones", texto: "Direcciones", Icono: MapPin, fondo: "#0891B2" },
  { ruta: "/equipos", texto: "Equipos", Icono: Package, fondo: "var(--success)" },
  { ruta: "/orden-trabajo", texto: "Orden de Trabajo", Icono: ClipboardList, fondo: "var(--warning)" },
  { ruta: "/informes", texto: "Informes Técnicos", Icono: FileText, fondo: "#EA580C" },
  { ruta: "/orden-compra", texto: "Orden de Compra", Icono: ShoppingCart, fondo: "#1E40AF" },
  { ruta: "/usuarios", texto: "Usuarios", Icono: UserCog, fondo: "#0D9488" }
];

function HeaderCotizacion({ navigate }) {
  return (
    <div className="header" style={{ background: "var(--gradient)", padding: "20px 32px", flexDirection: "row", alignItems: "center", gap: "16px" }}>
      <div className="header-left">
        <h1 style={{ color: "white", margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
          <FileSpreadsheet size={28} /> Cotizaciones
        </h1>
      </div>
      <div className="nav-buttons" style={{ gap: "10px" }}>
        {ENLACES.map(({ ruta, texto, Icono, fondo }) => (
          <button key={ruta} onClick={() => navigate(ruta)} className="logout-btn" style={{ background: fondo, color: "white" }}>
            <Icono size={18} />
            <span className="btn-label">{texto}</span>
          </button>
        ))}
        <button onClick={cerrarSesion} className="logout-btn" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
          <LogOut size={18} />
          <span className="btn-label">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

export default HeaderCotizacion;
