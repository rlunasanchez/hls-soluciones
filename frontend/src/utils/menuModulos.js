import { Home, Users, Contact, MapPin, Package, ClipboardList, FileText, FileSpreadsheet, ShoppingCart, UserCog } from "lucide-react";

// Menú superior del sistema: un solo lugar con las pantallas, su orden, icono y color. Cada pantalla muestra
// todas menos la propia (HeaderModulo). Al agregar un módulo nuevo basta sumarlo aquí.
export const MENU_MODULOS = [
  { label: "Inicio", path: "/home", Icono: Home, color: "var(--gradient)" },
  { label: "Clientes", path: "/clientes", Icono: Users, color: "var(--primary)" },
  { label: "Contactos", path: "/contactos", Icono: Contact, color: "#7C3AED" },
  { label: "Direcciones", path: "/direcciones", Icono: MapPin, color: "#0891B2" },
  { label: "Equipos", path: "/equipos", Icono: Package, color: "var(--success)" },
  { label: "Orden de Trabajo", path: "/orden-trabajo", Icono: ClipboardList, color: "var(--warning)" },
  { label: "Informes Técnicos", path: "/informes", Icono: FileText, color: "#EA580C" },
  { label: "Cotizaciones", path: "/cotizaciones", Icono: FileSpreadsheet, color: "#DB2777" },
  { label: "Orden de Compra", path: "/orden-compra", Icono: ShoppingCart, color: "#1E40AF" },
  { label: "Usuarios", path: "/usuarios", Icono: UserCog, color: "#0D9488" }
];
