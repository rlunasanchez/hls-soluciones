import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileSpreadsheet, Package, Users, Contact, MapPin, UserCog, LogOut, FileText, ClipboardList, ShoppingCart, Home,
  Search, Save, X, Plus, Trash2, FileDown, ChevronUp, ChevronDown, UserPlus, Pencil
} from "lucide-react";
import api from "../services/api";
import { getCached, invalidar } from "../services/cache";
import { toUpper, cerrarSesion, upperInput, parseToken, formatearRutInput } from "../utils/helpers";
import "../styles/OrdenTrabajo.css";
import "../styles/ordenes-componentes.css";
import "../styles/Contactos.css";
import "../styles/Direcciones.css";
import ContactoFormulario from "../components/contactos/ContactoFormulario";
import DireccionFormulario from "../components/direcciones/DireccionFormulario";
import { EMPRESA } from "../utils/empresa";
import { calcularTotales } from "../utils/cotizacionDoc";
import CotizacionLista from "../components/cotizaciones/CotizacionLista";
import ModalOpcionesPDFCotizacion from "../components/cotizaciones/ModalOpcionesPDFCotizacion";
import { usePaginaPersistente, useClampPagina } from "../hooks/usePaginacion";

const normTxt = (s) => String(s || "").toUpperCase().trim();
const clp = (n) => Math.round(Number(n) || 0).toLocaleString("es-CL");
const soloDigitos = (v) => String(v || "").replace(/[^0-9]/g, "");
const clpInput = (v) => {
  const digitos = soloDigitos(v);
  return digitos ? Number(digitos).toLocaleString("es-CL") : "";
};

const itemVacio = () => ({ sku: "", detalle: "", cantidad: 1, neto: "", descuento: "" });

const cotizacionVacia = () => ({
  fechaEmision: new Date().toISOString().split("T")[0],
  fechaValidoHasta: "",
  condicion: "Contado - CLP",
  glosa: "",
  clienteId: null,
  clienteRut: "",
  clienteRazonSocial: "",
  clienteDireccion: "",
  clienteCiudad: "",
  clienteComuna: "",
  clienteDireccionId: null,
  clienteTelefono: "",
  clienteEmail: "",
  contactoNombre: "",
  contactoFono: "",
  contactoEmail: "",
  contactoCargo: "",
  contactoId: null,
  contactoDireccion: "",
  contactoCiudad: "",
  contactoComuna: "",
  direccionId: null,
  contactosExtra: [],
  ejecutivo: parseToken().nombre || parseToken().usuario || "",
  ejecutivoFono: EMPRESA.fono,
  ejecutivoEmail: parseToken().email || "",
  items: [itemVacio()],
  ordenId: null,
  ordenNumero: ""
});

function Cotizaciones() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const ITEMS_POR_PAG = 4;
  const [editingId, setEditingId] = useState(null);
  const [cotParaPDF, setCotParaPDF] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);
  const [soloLectura, setSoloLectura] = useState(false);

  const [filtroFolio, setFiltroFolio] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [paginaActual, setPaginaActual] = usePaginaPersistente("pagCotizaciones", [filtroFolio, filtroCliente]);

  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const clienteDropdownRef = useRef(null);

  // El primer ítem siempre se ve completo; del 2° en adelante siguen
  // el mismo patrón de chips + resumen colapsable que Sucursales/Direcciones.
  const LIMITE_ITEMS = 1;
  const [itemsColapsado, setItemsColapsado] = useState(false);

  const [busquedaContacto, setBusquedaContacto] = useState("");
  const [mostrarDropdownContacto, setMostrarDropdownContacto] = useState(false);
  const contactoDropdownRef = useRef(null);

  // Otros Contactos (contactosExtra): mismo patrón que la OT (OrdenFormCliente.jsx).
  const [mostrarContactosExtra, setMostrarContactosExtra] = useState(false);
  const [contactosResumenAbierto, setContactosResumenAbierto] = useState(false);
  const [contactosManualVisibles, setContactosManualVisibles] = useState(() => new Set());
  const nombreContactoEnFocoRef = useRef("");
  // Buscador para agregar un contacto existente a "Otros Contactos".
  const [busquedaContactoExtra, setBusquedaContactoExtra] = useState("");
  const [mostrarDropdownContactoExtra, setMostrarDropdownContactoExtra] = useState(false);
  const [contactosExtraSugeridos, setContactosExtraSugeridos] = useState([]);
  const contactoExtraDropdownRef = useRef(null);
  const [contactoEnEdicion, setContactoEnEdicion] = useState(null);
  const [contactoEditTarget, setContactoEditTarget] = useState(null);
  // Buscador de Dirección (mantenedor de Direcciones), catálogo global —
  // mismo patrón que Contacto, un solo slot ligado al contacto principal.
  const [busquedaDireccion, setBusquedaDireccion] = useState("");
  const [mostrarDropdownDireccionBusq, setMostrarDropdownDireccionBusq] = useState(false);
  const [direccionesSugeridas, setDireccionesSugeridas] = useState([]);
  const direccionBusqDropdownRef = useRef(null);
  const [direccionEnEdicion, setDireccionEnEdicion] = useState(null);
  const [direccionEditTarget, setDireccionEditTarget] = useState(null);
  // Buscador de Dirección dentro de una fila de "Otros Contactos". Solo una
  // fila está visible a la vez, así que un único slot compartido alcanza.
  const [busquedaDireccionExtra, setBusquedaDireccionExtra] = useState("");
  const [mostrarDropdownDireccionExtra, setMostrarDropdownDireccionExtra] = useState(false);
  const [direccionesExtraSugeridas, setDireccionesExtraSugeridas] = useState([]);
  const direccionExtraDropdownRef = useRef(null);
  // Buscador de Dirección del Cliente (la "primera dirección"): ya no se
  // ingresa a mano en el mantenedor de Cliente, se busca y se llama.
  const [busquedaDireccionCliente, setBusquedaDireccionCliente] = useState("");
  const [mostrarDropdownDireccionCliente, setMostrarDropdownDireccionCliente] = useState(false);
  const [direccionesClienteSugeridas, setDireccionesClienteSugeridas] = useState([]);
  const direccionClienteDropdownRef = useRef(null);

  const [cotizacion, setCotizacion] = useState(cotizacionVacia());
  // Distinto de cotizacion.ordenId: esto es "por dónde entré al formulario",
  // no "si esta cotización está asociada a una OT". Una cotización asociada a
  // una OT igual se puede abrir desde el propio listado de Cotizaciones (Ver/
  // Editar), y en ese caso Cancelar/cerrar debe quedarse en Cotizaciones.
  const [origenOT, setOrigenOT] = useState(false);
  // Datos de la OT desde la que se abrió esta cotización vía el chip
  // "Cotizaciones Asociadas", para reabrirla en el mismo modo (Ver/Editar)
  // al cerrar, en vez de mandar siempre al listado de OT.
  const [ordenOrigen, setOrdenOrigen] = useState(null);

  // Nombre/Email del ejecutivo se toman de la BD (endpoint /perfil), no del
  // token, para que reflejen los cambios hechos en Gestión de Usuarios sin
  // tener que cerrar sesión. Si falla, se cae al token.
  const perfilRef = useRef(null);
  const cargarPerfil = async () => {
    if (perfilRef.current) return perfilRef.current;
    try {
      const res = await api.get("/api/auth/perfil");
      perfilRef.current = res.data;
    } catch {
      const t = parseToken();
      perfilRef.current = { usuario: t.usuario, nombre: t.nombre, email: t.email };
    }
    return perfilRef.current;
  };

  // Cotización vacía con el ejecutivo ya pre-rellenado desde el perfil de la BD.
  const nuevaCotizacion = () => {
    const base = cotizacionVacia();
    const p = perfilRef.current;
    if (p) {
      base.ejecutivo = p.nombre || p.usuario || base.ejecutivo;
      base.ejecutivoEmail = p.email || base.ejecutivoEmail;
    }
    return base;
  };

  useEffect(() => {
    const controller = new AbortController();
    cargarPerfil();
    fetchClientes(controller.signal);
    fetchCotizaciones(controller.signal);
    return () => controller.abort();
  }, []);

  // Abrir una cotización puntual desde el chip "Cotizaciones Asociadas" de una
  // OT: navigate('/cotizaciones', { state: { cotizacionId } }). Se abre en el
  // mismo modo que tenía la OT (Ver → solo lectura, Editar → editable).
  useEffect(() => {
    const cotizacionId = location.state?.cotizacionId;
    if (!cotizacionId) return;
    const cotizacionSoloLectura = location.state?.cotizacionSoloLectura;
    const volverOrdenId = location.state?.volverOrdenId;
    const volverOrdenSoloLectura = location.state?.volverOrdenSoloLectura;
    window.history.replaceState({}, document.title);
    (async () => {
      // cargarCotizacion resetea origenOT a false (Ver/Editar desde el propio
      // listado de Cotizaciones no debe volver a la OT) — acá sí venimos de
      // la OT, así que se pisa después para que Cancelar/Cerrar vuelva ahí.
      await cargarCotizacion({ id: cotizacionId }, !!cotizacionSoloLectura);
      setOrigenOT(true);
      if (volverOrdenId) setOrdenOrigen({ id: volverOrdenId, soloLectura: !!volverOrdenSoloLectura });
    })();
  }, []);

  // Cotización nueva pre-rellenada, llega por navigate('/cotizaciones', { state }) desde:
  // - el menú "..." de Ordenes de Trabajo → { orden }: además queda asociada (orden_id)
  // - el menú "..." de Clientes → { cliente }: solo prefill, sin asociar a ninguna OT
  // En los dos casos la asociación a OT es opcional: crear desde "Nueva Cotización" en
  // este módulo no asocia nada.
  useEffect(() => {
    const orden = location.state?.orden;
    const clienteNav = location.state?.cliente;
    if (!orden && !clienteNav) return;

    const init = async () => {
      setEditingId(null);
      setSoloLectura(false);
      await cargarPerfil();

      // El cliente debe quedar "seleccionado" (no solo el texto de la búsqueda)
      // para poder buscar entre sus otros contactos, igual que en la OT.
      let clienteMatch = clienteNav || null;
      try {
        const res = await getCached("/api/clientes");
        setClientes(res.data);
        if (orden) {
          clienteMatch = (orden.cliente_id && res.data.find((c) => c.id === orden.cliente_id)) ||
            res.data.find((c) => c.razon_social === orden.cliente) || null;
        } else if (clienteNav) {
          clienteMatch = res.data.find((c) => c.id === clienteNav.id) || clienteNav;
        }
      } catch { /* sigue con los datos que trae la navegación */ }

      setClienteSeleccionado(clienteMatch);

      if (orden) {
        setOrigenOT(true);
        setBusquedaCliente(toUpper(orden.cliente || ""));
        setBusquedaContacto(toUpper(orden.contacto || ""));
        setCotizacion({
          ...nuevaCotizacion(),
          clienteId: orden.cliente_id || clienteMatch?.id || null,
          clienteRut: orden.rut || clienteMatch?.rut || "",
          clienteRazonSocial: toUpper(orden.cliente || ""),
          clienteDireccion: toUpper(orden.direccion || clienteMatch?.direccion || ""),
          clienteCiudad: toUpper(orden.ciudad || clienteMatch?.ciudad || ""),
          clienteComuna: toUpper(orden.comuna || clienteMatch?.comuna || ""),
          clienteDireccionId: orden.cliente_direccion_id || null,
          clienteTelefono: orden.fono_principal || clienteMatch?.telefono || "",
          clienteEmail: orden.email || clienteMatch?.email || "",
          contactoNombre: toUpper(orden.contacto || ""),
          contactoFono: orden.fono_contacto || "",
          contactoEmail: orden.email_contacto || "",
          contactoCargo: toUpper(orden.cargo_contacto || ""),
          contactoId: orden.contacto_id || null,
          contactoDireccion: toUpper(orden.contacto_direccion || ""),
          contactoCiudad: toUpper(orden.contacto_ciudad || ""),
          contactoComuna: toUpper(orden.contacto_comuna || ""),
          direccionId: orden.direccion_id || null,
          ordenId: orden.id,
          ordenNumero: orden.numero_orden || ""
        });
      } else {
        setBusquedaCliente(toUpper(clienteNav.razon_social || ""));
        setCotizacion({
          ...nuevaCotizacion(),
          clienteId: clienteNav.id || null,
          clienteRut: clienteNav.rut || "",
          clienteRazonSocial: toUpper(clienteNav.razon_social || ""),
          clienteDireccion: toUpper(clienteNav.direccion || ""),
          clienteCiudad: toUpper(clienteNav.ciudad || ""),
          clienteComuna: toUpper(clienteNav.comuna || ""),
          clienteTelefono: clienteNav.telefono || "",
          clienteEmail: clienteNav.email || ""
        });
      }
      setMostrarFormulario(true);
      window.history.replaceState({}, document.title);
    };
    init();
  }, []);

  // Cierra los dropdowns de cliente/contacto al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target)) {
        setMostrarDropdownClientes(false);
      }
      if (contactoDropdownRef.current && !contactoDropdownRef.current.contains(event.target)) {
        setMostrarDropdownContacto(false);
      }
      if (contactoExtraDropdownRef.current && !contactoExtraDropdownRef.current.contains(event.target)) {
        setMostrarDropdownContactoExtra(false);
      }
      if (direccionBusqDropdownRef.current && !direccionBusqDropdownRef.current.contains(event.target)) {
        setMostrarDropdownDireccionBusq(false);
      }
      if (direccionExtraDropdownRef.current && !direccionExtraDropdownRef.current.contains(event.target)) {
        setMostrarDropdownDireccionExtra(false);
      }
      if (direccionClienteDropdownRef.current && !direccionClienteDropdownRef.current.contains(event.target)) {
        setMostrarDropdownDireccionCliente(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchClientes = async (signal) => {
    try {
      const res = await getCached("/api/clientes", { signal });
      setClientes(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar clientes:", err);
    }
  };

  const fetchCotizaciones = async (signal) => {
    setLoading(true);
    try {
      const res = await getCached("/api/cotizaciones?page=1&limit=10000", { signal });
      setCotizaciones(res.data.cotizaciones);
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar cotizaciones:", err);
    } finally {
      setLoading(false);
    }
  };

  const cotizacionesFiltradas = cotizaciones.filter((cot) => {
    if (filtroFolio && !String(cot.folio).includes(filtroFolio.trim())) return false;
    if (filtroCliente && !cot.cliente_razon_social?.toLowerCase().includes(filtroCliente.toLowerCase())) return false;
    return true;
  });
  const totalPaginas = Math.ceil(cotizacionesFiltradas.length / ITEMS_POR_PAG);
  const cotizacionesPag = cotizacionesFiltradas.slice((paginaActual - 1) * ITEMS_POR_PAG, paginaActual * ITEMS_POR_PAG);
  useClampPagina(paginaActual, setPaginaActual, totalPaginas);

  const parseItems = (val) => {
    try {
      const arr = JSON.parse(val || "[]");
      return Array.isArray(arr) && arr.length ? arr : [itemVacio()];
    } catch {
      return [itemVacio()];
    }
  };

  // Igual que parseItems, pero sin el mínimo de 1: Otros Contactos parte vacío.
  const parseExtra = (val) => {
    try {
      const arr = JSON.parse(val || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const abrirNueva = async () => {
    await cargarPerfil();
    setEditingId(null);
    setSoloLectura(false);
    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setBusquedaContacto("");
    setItemsColapsado(false);
    setMostrarContactosExtra(false);
    setContactosResumenAbierto(false);
    setContactosManualVisibles(new Set());
    setOrigenOT(false);
    setCotizacion(nuevaCotizacion());
    setMostrarFormulario(true);
  };

  const cargarCotizacion = async (cot, readOnly) => {
    const res = await api.get(`/api/cotizaciones/${cot.id}`);
    const c = res.data;
    setEditingId(c.id);
    setSoloLectura(readOnly);
    setOrigenOT(false);
    // clientes puede no estar cargado todavía si se entra directo por acá
    // (ej. desde el chip "Cotizaciones asociadas" de una OT recién montada).
    let listaClientes = clientes;
    if (listaClientes.length === 0) {
      try {
        const resCli = await api.get("/api/clientes");
        listaClientes = resCli.data;
        setClientes(resCli.data);
      } catch { /* sigue con clienteSeleccionado en null */ }
    }
    const cl = listaClientes.find((x) => x.id === c.cliente_id);
    setClienteSeleccionado(cl || null);
    setBusquedaCliente(c.cliente_razon_social || "");
    setBusquedaContacto(c.contacto_nombre || "");
    setItemsColapsado(false);
    setMostrarContactosExtra(false);
    setContactosResumenAbierto(false);
    setContactosManualVisibles(new Set());
    setCotizacion({
      fechaEmision: (c.fecha_emision || "").substring(0, 10),
      fechaValidoHasta: (c.fecha_valido_hasta || "").substring(0, 10),
      condicion: c.condicion || "",
      glosa: c.glosa || "",
      clienteId: c.cliente_id || null,
      clienteRut: c.cliente_rut || "",
      clienteRazonSocial: c.cliente_razon_social || "",
      clienteDireccion: c.cliente_direccion || "",
      clienteCiudad: c.cliente_ciudad || "",
      clienteComuna: c.cliente_comuna || "",
      clienteDireccionId: c.cliente_direccion_id || null,
      clienteTelefono: c.cliente_telefono || "",
      clienteEmail: c.cliente_email || "",
      contactoNombre: c.contacto_nombre || "",
      contactoFono: c.contacto_fono || "",
      contactoEmail: c.contacto_email || "",
      contactoCargo: c.contacto_cargo || "",
      contactoId: c.contacto_id || null,
      contactoDireccion: c.contacto_direccion || "",
      contactoCiudad: c.contacto_ciudad || "",
      contactoComuna: c.contacto_comuna || "",
      direccionId: c.direccion_id || null,
      contactosExtra: parseExtra(c.contactos_extra),
      ejecutivo: c.ejecutivo || "",
      ejecutivoFono: c.ejecutivo_fono || "",
      ejecutivoEmail: c.ejecutivo_email || "",
      items: parseItems(c.items),
      ordenId: c.orden_id || null,
      ordenNumero: c.orden_numero || ""
    });
    setMostrarFormulario(true);
  };

  const verCotizacion = (cot) => cargarCotizacion(cot, true);
  const editarCotizacion = (cot) => cargarCotizacion(cot, false);

  const eliminarCotizacion = async (id) => {
    if (!confirm("¿Seguro que desea eliminar esta cotización?")) return;
    try {
      await api.delete(`/api/cotizaciones/${id}`);
      invalidar("/api/ordenes");
      fetchCotizaciones();
    } catch (err) {
      console.error("Error al eliminar cotización:", err);
      alert("Error al eliminar la cotización");
    }
  };

  const generarPDF = (cot) => {
    setCotParaPDF(cot);
  };

  const generarPDFActual = async () => {
    if (!editingId) return;
    const res = await api.get(`/api/cotizaciones/${editingId}`);
    setCotParaPDF(res.data);
  };

  const cerrarFormulario = () => {
    // Solo vuelve a la vista de OT si se entró al formulario DESDE la OT
    // (origenOT). Si la cotización tiene ordenId pero se abrió para Ver/Editar
    // desde el propio listado de Cotizaciones, se queda en Cotizaciones.
    const vuelveAOT = origenOT;
    const destinoOrden = ordenOrigen;
    setMostrarFormulario(false);
    setEditingId(null);
    setSoloLectura(false);
    setCotizacion(cotizacionVacia());
    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setBusquedaContacto("");
    setItemsColapsado(false);
    setMostrarContactosExtra(false);
    setContactosResumenAbierto(false);
    setContactosManualVisibles(new Set());
    setOrigenOT(false);
    setOrdenOrigen(null);
    if (vuelveAOT) {
      // Si se entró desde el chip "Cotizaciones Asociadas" de una OT puntual,
      // reabrirla en el mismo modo (Ver/Editar) en vez de mandar al listado.
      if (destinoOrden) {
        navigate("/orden-trabajo", { state: { verOrdenId: destinoOrden.id, verOrdenSoloLectura: destinoOrden.soloLectura } });
      } else {
        navigate("/orden-trabajo");
      }
    }
  };

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente(toUpper(cliente.razon_social));
    setMostrarDropdownClientes(false);
    setCotizacion((prev) => ({
      ...prev,
      clienteId: cliente.id,
      clienteRut: cliente.rut || "",
      clienteRazonSocial: toUpper(cliente.razon_social),
      clienteDireccion: "",
      clienteCiudad: "",
      clienteComuna: "",
      clienteDireccionId: null,
      clienteTelefono: cliente.telefono || "",
      clienteEmail: cliente.email || ""
    }));
  };

  const qCliente = busquedaCliente.toLowerCase();
  const digRut = (v) => (v || "").replace(/[^0-9]/g, "");
  const qClienteDig = digRut(busquedaCliente);
  const clienteEsNumerico = /^[0-9]/.test(busquedaCliente.trim());
  const clientesFiltrados = busquedaCliente.length >= 2 && (!clienteSeleccionado || toUpper(clienteSeleccionado.razon_social) !== busquedaCliente)
    ? clientes.filter((c) =>
        c.razon_social?.toLowerCase().includes(qCliente) ||
        c.codigo?.toLowerCase().includes(qCliente) ||
        (clienteEsNumerico && qClienteDig && digRut(c.rut).includes(qClienteDig))
      ).slice(0, 10)
    : [];

  // Contacto: catálogo global (mantenedor de Contactos), independiente del
  // cliente — se busca y se copia, mismo patrón que el buscador de Equipo.
  const [contactosSugeridos, setContactosSugeridos] = useState([]);
  useEffect(() => {
    if (busquedaContacto.trim().length < 2) { setContactosSugeridos([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/contactos?q=${encodeURIComponent(busquedaContacto.trim())}`);
        setContactosSugeridos(res.data);
      } catch { setContactosSugeridos([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaContacto]);

  useEffect(() => {
    if (busquedaContactoExtra.trim().length < 2) { setContactosExtraSugeridos([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/contactos?q=${encodeURIComponent(busquedaContactoExtra.trim())}`);
        setContactosExtraSugeridos(res.data);
      } catch { setContactosExtraSugeridos([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaContactoExtra]);

  // Al elegir otro contacto como principal, el principal anterior baja a
  // "Otros Contactos" (en vez de perderse), y si el elegido ya estaba ahí,
  // se saca de esa lista para no quedar duplicado.
  // Da de alta un contacto en el mantenedor de Contactos, o si el backend
  // responde "ya existe" (nombre repetido), lo busca y lo enlaza igual, para
  // no dejar la fila sin poder editarse cuando el contacto ya estaba ahí.
  const registrarOEnlazarContacto = async (nombre, email, fono, cargo) => {
    if (String(nombre || "").trim().length < 3) {
      alert("Ingrese el nombre completo del contacto (mínimo 3 caracteres) antes de registrarlo.");
      return null;
    }
    // Aviso de "parecidos" antes de crear: si ya hay contactos con nombre
    // similar (no idéntico — eso ya lo maneja el enlace automático de más
    // abajo), se le pregunta si de verdad quiere crear uno nuevo.
    try {
      const parecidos = await api.get(`/api/contactos?q=${encodeURIComponent(nombre.trim())}`);
      const similares = parecidos.data.filter((x) => normTxt(x.nombre) !== normTxt(nombre));
      if (similares.length > 0) {
        const listado = similares.slice(0, 5).map((x) => `• ${x.nombre}${x.cargo ? ` (${x.cargo})` : ''}`).join('\n');
        const seguir = confirm(`Ya existen contactos parecidos:\n${listado}\n\n¿Seguro que quiere crear "${nombre.trim()}" como uno nuevo?\n(Cancelar para elegir uno de arriba en el buscador)`);
        if (!seguir) return null;
      }
    } catch { /* si falla la búsqueda de parecidos, sigue igual */ }
    try {
      const res = await api.post("/api/contactos", { nombre, email, fono, cargo });
      const lista = await api.get(`/api/contactos?q=${encodeURIComponent(nombre)}`);
      const creado = lista.data.find((x) => x.codigo === res.data.codigo);
      return { id: creado?.id || null, yaExistia: false };
    } catch (err) {
      if (err.response?.status === 400) {
        const lista = await api.get(`/api/contactos?q=${encodeURIComponent(nombre)}`);
        const existente = lista.data.find((x) => normTxt(x.nombre) === normTxt(nombre));
        if (existente) return { id: existente.id, yaExistia: true };
      }
      alert(err.response?.data?.msg || "Error al registrar el contacto.");
      return null;
    }
  };

  const seleccionarContactoBusqueda = (c) => {
    const nombreNuevo = normTxt(c.nombre);
    setCotizacion((prev) => {
      let extras = prev.contactosExtra.filter((x) => normTxt(x.nombre) !== nombreNuevo);
      if (normTxt(prev.contactoNombre) && normTxt(prev.contactoNombre) !== nombreNuevo) {
        extras = [...extras, {
          nombre: prev.contactoNombre, email: prev.contactoEmail,
          fono: prev.contactoFono, cargo: prev.contactoCargo,
          contactoId: prev.contactoId || null
        }];
      }
      return {
        ...prev,
        contactoNombre: c.nombre,
        contactoEmail: c.email || "",
        contactoFono: c.fono || "",
        contactoCargo: c.cargo || "",
        contactoId: c.id,
        contactosExtra: extras
      };
    });
    setBusquedaContacto(c.nombre);
    setMostrarDropdownContacto(false);
  };

  const abrirEditarContacto = async (target, id) => {
    try {
      const res = await api.get(`/api/contactos/${id}`);
      setContactoEnEdicion(res.data);
      setContactoEditTarget(target);
    } catch {
      alert("No se pudo cargar el contacto para editar.");
    }
  };

  const guardarEdicionContacto = async (payload, id, mantener = false) => {
    try {
      await api.put(`/api/contactos/${id}`, payload);
      const res = await api.get(`/api/contactos/${id}`);
      const actualizado = res.data;
      if (contactoEditTarget === 'principal') {
        setCotizacion((prev) => ({
          ...prev,
          contactoNombre: toUpper(actualizado.nombre),
          contactoEmail: actualizado.email || "",
          contactoFono: actualizado.fono || "",
          contactoCargo: toUpper(actualizado.cargo || "")
        }));
      } else if (typeof contactoEditTarget === 'number') {
        setCotizacion((prev) => {
          const arr = [...prev.contactosExtra];
          arr[contactoEditTarget] = {
            ...arr[contactoEditTarget],
            nombre: toUpper(actualizado.nombre),
            email: actualizado.email || "",
            fono: actualizado.fono || "",
            cargo: toUpper(actualizado.cargo || "")
          };
          return { ...prev, contactosExtra: arr };
        });
      }
      if (mantener) {
        setContactoEnEdicion(actualizado);
      } else {
        setContactoEnEdicion(null);
        setContactoEditTarget(null);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar el contacto.");
    }
  };

  // Dirección (del contacto): catálogo global (mantenedor de Direcciones),
  // independiente del cliente — mismo patrón que Contacto, un solo slot.
  useEffect(() => {
    if (busquedaDireccion.trim().length < 2) { setDireccionesSugeridas([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/direcciones?q=${encodeURIComponent(busquedaDireccion.trim())}`);
        setDireccionesSugeridas(res.data);
      } catch { setDireccionesSugeridas([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaDireccion]);

  const seleccionarDireccionBusqueda = (d) => {
    setCotizacion((prev) => ({
      ...prev,
      contactoDireccion: toUpper(d.direccion || ""),
      contactoCiudad: toUpper(d.ciudad || ""),
      contactoComuna: toUpper(d.comuna || ""),
      direccionId: d.id
    }));
    setBusquedaDireccion(d.direccion);
    setMostrarDropdownDireccionBusq(false);
  };

  const registrarOEnlazarDireccion = async (direccion, ciudad, comuna) => {
    if (String(direccion || "").trim().length < 5) {
      alert("Ingrese la dirección completa (mínimo 5 caracteres) antes de registrarla.");
      return null;
    }
    // Aviso de "parecidas" antes de crear (ver registrarOEnlazarContacto).
    try {
      const parecidas = await api.get(`/api/direcciones?q=${encodeURIComponent(direccion.trim())}`);
      const similares = parecidas.data.filter((x) => normTxt(x.direccion) !== normTxt(direccion));
      if (similares.length > 0) {
        const listado = similares.slice(0, 5).map((x) => `• ${x.direccion}${x.comuna ? ` (${x.comuna})` : ''}`).join('\n');
        const seguir = confirm(`Ya existen direcciones parecidas:\n${listado}\n\n¿Seguro que quiere crear "${direccion.trim()}" como una nueva?\n(Cancelar para elegir una de arriba en el buscador)`);
        if (!seguir) return null;
      }
    } catch { /* si falla la búsqueda de parecidas, sigue igual */ }
    try {
      const res = await api.post("/api/direcciones", { direccion, ciudad, comuna });
      const lista = await api.get(`/api/direcciones?q=${encodeURIComponent(direccion)}`);
      const creada = lista.data.find((x) => x.codigo === res.data.codigo);
      return { id: creada?.id || null, yaExistia: false };
    } catch (err) {
      if (err.response?.status === 400) {
        const lista = await api.get(`/api/direcciones?q=${encodeURIComponent(direccion)}`);
        const existente = lista.data.find((x) => normTxt(x.direccion) === normTxt(direccion));
        if (existente) return { id: existente.id, yaExistia: true };
      }
      alert(err.response?.data?.msg || "Error al registrar la dirección.");
      return null;
    }
  };

  const registrarDireccionContacto = async () => {
    const resultado = await registrarOEnlazarDireccion(cotizacion.contactoDireccion, cotizacion.contactoCiudad, cotizacion.contactoComuna);
    if (!resultado) return;
    alert(resultado.yaExistia ? `La dirección ya estaba en el mantenedor — se enlazó.` : `Dirección registrada en el mantenedor.`);
    setCotizacion((prev) => ({ ...prev, direccionId: resultado.id }));
  };

  const abrirEditarDireccion = async (target, id) => {
    try {
      const res = await api.get(`/api/direcciones/${id}`);
      setDireccionEnEdicion(res.data);
      setDireccionEditTarget(target);
    } catch {
      alert("No se pudo cargar la dirección para editar.");
    }
  };

  const guardarEdicionDireccion = async (payload, id, mantener = false) => {
    try {
      await api.put(`/api/direcciones/${id}`, payload);
      const res = await api.get(`/api/direcciones/${id}`);
      const actualizada = res.data;
      if (direccionEditTarget === 'principal') {
        setCotizacion((prev) => ({
          ...prev,
          contactoDireccion: toUpper(actualizada.direccion || ""),
          contactoCiudad: toUpper(actualizada.ciudad || ""),
          contactoComuna: toUpper(actualizada.comuna || "")
        }));
      } else if (direccionEditTarget === 'cliente') {
        setCotizacion((prev) => ({
          ...prev,
          clienteDireccion: toUpper(actualizada.direccion || ""),
          clienteCiudad: toUpper(actualizada.ciudad || ""),
          clienteComuna: toUpper(actualizada.comuna || "")
        }));
      } else if (typeof direccionEditTarget === 'number') {
        setCotizacion((prev) => {
          const arr = [...prev.contactosExtra];
          arr[direccionEditTarget] = {
            ...arr[direccionEditTarget],
            direccion: toUpper(actualizada.direccion || ""),
            ciudad: toUpper(actualizada.ciudad || ""),
            comuna: toUpper(actualizada.comuna || "")
          };
          return { ...prev, contactosExtra: arr };
        });
      }
      if (mantener) {
        setDireccionEnEdicion(actualizada);
      } else {
        setDireccionEnEdicion(null);
        setDireccionEditTarget(null);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar la dirección.");
    }
  };

  // Buscador de Dirección dentro de una fila de "Otros Contactos": mismo
  // catálogo global, consulta propia.
  useEffect(() => {
    if (busquedaDireccionExtra.trim().length < 2) { setDireccionesExtraSugeridas([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/direcciones?q=${encodeURIComponent(busquedaDireccionExtra.trim())}`);
        setDireccionesExtraSugeridas(res.data);
      } catch { setDireccionesExtraSugeridas([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaDireccionExtra]);

  const seleccionarDireccionExtraBusqueda = (d, idx) => {
    setCotizacion((prev) => {
      const arr = [...prev.contactosExtra];
      arr[idx] = {
        ...arr[idx],
        direccion: toUpper(d.direccion || ""),
        ciudad: toUpper(d.ciudad || ""),
        comuna: toUpper(d.comuna || ""),
        direccionId: d.id
      };
      return { ...prev, contactosExtra: arr };
    });
    setBusquedaDireccionExtra(d.direccion);
    setMostrarDropdownDireccionExtra(false);
  };

  const registrarDireccionExtra = async (contacto, idx) => {
    const resultado = await registrarOEnlazarDireccion(contacto.direccion, contacto.ciudad, contacto.comuna);
    if (!resultado) return;
    alert(resultado.yaExistia ? `La dirección ya estaba en el mantenedor — se enlazó.` : `Dirección registrada en el mantenedor.`);
    setCotizacion((prev) => {
      const arr = [...prev.contactosExtra];
      arr[idx] = { ...arr[idx], direccionId: resultado.id };
      return { ...prev, contactosExtra: arr };
    });
  };

  // Buscador de Dirección del Cliente (la "primera dirección" de la
  // cotización): mismo catálogo global, ya no se ingresa a mano en el
  // mantenedor de Cliente — se busca y se llama, igual que Contacto.
  useEffect(() => {
    if (busquedaDireccionCliente.trim().length < 2) { setDireccionesClienteSugeridas([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/direcciones?q=${encodeURIComponent(busquedaDireccionCliente.trim())}`);
        setDireccionesClienteSugeridas(res.data);
      } catch { setDireccionesClienteSugeridas([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaDireccionCliente]);

  const seleccionarDireccionClienteBusqueda = (d) => {
    setCotizacion((prev) => ({
      ...prev,
      clienteDireccion: toUpper(d.direccion || ""),
      clienteCiudad: toUpper(d.ciudad || ""),
      clienteComuna: toUpper(d.comuna || ""),
      clienteDireccionId: d.id
    }));
    setBusquedaDireccionCliente(d.direccion);
    setMostrarDropdownDireccionCliente(false);
  };

  const registrarDireccionCliente = async () => {
    const resultado = await registrarOEnlazarDireccion(cotizacion.clienteDireccion, cotizacion.clienteCiudad, cotizacion.clienteComuna);
    if (!resultado) return;
    alert(resultado.yaExistia
      ? `La dirección ya estaba en el mantenedor — se enlazó.`
      : `Dirección registrada en el mantenedor.`);
    setCotizacion((prev) => ({ ...prev, clienteDireccionId: resultado.id }));
  };

  const actualizarItem = (idx, campo, valor) => {
    setCotizacion((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [campo]: valor };
      return { ...prev, items };
    });
  };

  const agregarItem = () => {
    setCotizacion((prev) => ({ ...prev, items: [...prev.items, itemVacio()] }));
    setItemsColapsado(false);
  };
  const quitarItem = (idx) => {
    if (!window.confirm(`¿Eliminar el Ítem ${idx + 1}?`)) return;
    setCotizacion((prev) => {
      const restantes = prev.items.filter((_, i) => i !== idx);
      // Nunca dejar la lista vacía: el formulario siempre muestra el Ítem 1.
      const items = restantes.length ? restantes : [itemVacio()];
      if (items.length <= LIMITE_ITEMS) setItemsColapsado(false);
      return { ...prev, items };
    });
  };

  const renderItemCard = (item, idx) => {
    if (!item) return null;
    const bruto = (Number(item.cantidad) || 0) * (Number(item.neto) || 0);
    const descuentoPct = Math.min(100, Math.max(0, Number(item.descuento) || 0));
    const totalFila = Math.max(0, bruto * (1 - descuentoPct / 100));
    return (
      <div key={idx} style={{
        border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px 8px',
        marginBottom: 8, background: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Ítem {idx + 1}
          </span>
          {!soloLectura && (
            <button type="button" onClick={() => quitarItem(idx)} title="Quitar ítem"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', display: 'flex' }}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
          <div className="of-f" style={{ flex: '0 0 70px' }}>
            <label>SKU</label>
            <input type="text" value={item.sku} onChange={(e) => actualizarItem(idx, 'sku', e.target.value)} disabled={soloLectura} />
          </div>
          <div className="of-f" style={{ flex: '0 0 55px' }}>
            <label>Cant.</label>
            <input type="number" min="0" value={item.cantidad} onChange={(e) => actualizarItem(idx, 'cantidad', e.target.value)} disabled={soloLectura} />
          </div>
          <div className="of-f" style={{ flex: '0 0 78px' }}>
            <label>Neto</label>
            <input type="text" inputMode="numeric" value={clpInput(item.neto)} onChange={(e) => actualizarItem(idx, 'neto', soloDigitos(e.target.value))} disabled={soloLectura} />
          </div>
          <div className="of-f" style={{ flex: '0 0 78px', position: 'relative' }}>
            <label>Descuento</label>
            <input
              type="text"
              inputMode="numeric"
              value={item.descuento}
              onChange={(e) => {
                let d = soloDigitos(e.target.value);
                if (d && Number(d) > 100) d = "100";
                actualizarItem(idx, 'descuento', d);
              }}
              disabled={soloLectura}
              style={{ paddingRight: 16 }}
            />
            {item.descuento && (
              <span style={{ position: 'absolute', right: 6, bottom: 5, fontSize: '.75rem', color: 'var(--text-muted)', pointerEvents: 'none' }}>%</span>
            )}
          </div>
          <div className="of-f" style={{ flex: '0 0 78px' }}>
            <label>Total</label>
            <input type="text" value={clp(totalFila)} disabled />
          </div>
          <div className="of-f" style={{ flex: '1 1 200px' }}>
            <label>Detalle</label>
            <textarea rows={1} placeholder="Ej: Visita técnica" value={item.detalle} onChange={(e) => actualizarItem(idx, 'detalle', upperInput(e))} disabled={soloLectura}
              style={{ resize: 'vertical', fontFamily: 'inherit', minHeight: 0, height: 40 }} />
          </div>
        </div>
      </div>
    );
  };

  const totales = calcularTotales(cotizacion.items);

  const guardarCotizacion = async (e, mantener = false) => {
    e.preventDefault();
    if (guardandoRef.current) return;

    const payload = {
      ...cotizacion,
      items: cotizacion.items.filter((i) =>
        String(i.sku || "").trim() || String(i.detalle || "").trim() || Number(i.neto) > 0
      )
    };

    const eraNueva = !editingId;
    guardandoRef.current = true;
    setGuardando(true);
    try {
      let idActual = editingId;
      if (editingId) {
        await api.put(`/api/cotizaciones/${editingId}`, payload);
      } else {
        const res = await api.post("/api/cotizaciones", payload);
        idActual = res.data.id;
        setEditingId(idActual);
      }

      // El mantenedor de OT muestra un punto si la orden tiene cotizaciones;
      // ese listado está cacheado, así que hay que invalidarlo tras guardar.
      invalidar("/api/ordenes");

      if (mantener) {
        const origenOTAntes = origenOT;
        await cargarCotizacion({ id: idActual }, false);
        setOrigenOT(origenOTAntes);
      } else {
        alert(eraNueva ? "Cotización guardada exitosamente" : "Cotización actualizada exitosamente");
        const vuelveAOT = origenOT;
        cerrarFormulario();
        // cerrarFormulario ya navega de vuelta a la OT si corresponde; si no
        // se entró desde una OT, se queda en el listado de Cotizaciones.
        if (!vuelveAOT) {
          if (eraNueva) setPaginaActual(1);
          fetchCotizaciones();
        }
      }
    } catch (err) {
      console.error("Error al guardar cotización:", err);
      alert(err.response?.data?.msg || "Error al guardar la cotización");
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  return (
    <div className="container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
        <div className="header-left">
          <h1 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileSpreadsheet size={28} /> Cotizaciones
          </h1>
        </div>
        <div className="nav-buttons" style={{ gap: '10px' }}>
          <button onClick={() => navigate("/home")} className="logout-btn" style={{ background: 'var(--gradient)', color: 'white' }}>
            <Home size={18} />
            <span className="btn-label">Inicio</span>
          </button>
          <button onClick={() => navigate("/clientes")} className="logout-btn" style={{ background: 'var(--primary)', color: 'white' }}>
            <Users size={18} />
            <span className="btn-label">Clientes</span>
          </button>
          <button onClick={() => navigate("/contactos")} className="logout-btn" style={{ background: '#7C3AED', color: 'white' }}>
            <Contact size={18} />
            <span className="btn-label">Contactos</span>
          </button>
          <button onClick={() => navigate("/direcciones")} className="logout-btn" style={{ background: '#0891B2', color: 'white' }}>
            <MapPin size={18} />
            <span className="btn-label">Direcciones</span>
          </button>
          <button onClick={() => navigate("/equipos")} className="logout-btn" style={{ background: 'var(--success)', color: 'white' }}>
            <Package size={18} />
            <span className="btn-label">Equipos</span>
          </button>
          <button onClick={() => navigate("/orden-trabajo")} className="logout-btn" style={{ background: 'var(--warning)', color: 'white' }}>
            <ClipboardList size={18} />
            <span className="btn-label">Orden de Trabajo</span>
          </button>
          <button onClick={() => navigate("/informes")} className="logout-btn" style={{ background: '#EA580C', color: 'white' }}>
            <FileText size={18} />
            <span className="btn-label">Informes Técnicos</span>
          </button>
          <button onClick={() => navigate("/orden-compra")} className="logout-btn" style={{ background: '#1E40AF', color: 'white' }}>
            <ShoppingCart size={18} />
            <span className="btn-label">Orden de Compra</span>
          </button>
          <button onClick={() => navigate("/usuarios")} className="logout-btn" style={{ background: '#0D9488', color: 'white' }}>
            <UserCog size={18} />
            <span className="btn-label">Usuarios</span>
          </button>
          <button onClick={cerrarSesion} className="logout-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <LogOut size={18} />
            <span className="btn-label">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      {!mostrarFormulario ? (
          <div className="ot-list-wrap">
            <CotizacionLista
              cotizaciones={cotizacionesPag}
              loading={loading}
              filtroFolio={filtroFolio}
              onFiltroFolioChange={setFiltroFolio}
              filtroCliente={filtroCliente}
              onFiltroClienteChange={setFiltroCliente}
              onLimpiar={() => { setFiltroFolio(""); setFiltroCliente(""); }}
              onNueva={abrirNueva}
              paginaActual={paginaActual}
              totalPaginas={totalPaginas}
              onPageChange={setPaginaActual}
              onVer={verCotizacion}
              onEditar={editarCotizacion}
              onEliminar={eliminarCotizacion}
              onPDF={generarPDF}
            />
          </div>
        ) : (
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px' }}>
            <div className="of-wrap">
              <form onSubmit={guardarCotizacion} className="of-form" noValidate>
                <div className="of-head">
                  <h2>{soloLectura ? "Ver Cotización" : editingId ? "Editar Cotización" : "Nueva Cotización"}{cotizacion.ordenId ? <span style={{ marginLeft: 8, fontWeight: 600, fontSize: '0.75rem', color: '#fff', background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: 999 }}>· asociada a OT N° {String(cotizacion.ordenNumero || "").split("-").pop() || "?"}</span> : ""}</h2>
                  <button type="button" className="of-head-close" onClick={cerrarFormulario}><X size={18} /></button>
                </div>

                <div className="of-cols of-cols-cot">
                <div className="of-col-left" style={{ minWidth: 0 }}>
                <div className="of-sec primary">
                  <div className="of-st success">Datos del Cliente</div>

                  <div style={{ marginTop: 10, marginBottom: 8 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>
                      <Search size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                      Buscar y Seleccionar Cliente
                    </label>
                    <div style={{ position: 'relative' }} ref={clienteDropdownRef}>
                      <input
                        type="text"
                        className="ot-search"
                        placeholder="Escriba para buscar cliente por nombre o RUT..."
                        value={busquedaCliente}
                        onChange={(e) => {
                          const crudo = e.target.value;
                          const val = /^[0-9][0-9Kk.-]*$/.test(crudo) ? formatearRutInput(crudo) : upperInput(e);
                          setBusquedaCliente(val);
                          setMostrarDropdownClientes(val.length >= 2);
                        }}
                        onFocus={() => { if (busquedaCliente.length >= 2) setMostrarDropdownClientes(true); }}
                        disabled={soloLectura}
                        style={{ background: clienteSeleccionado ? '#E0F2FE' : 'white' }}
                      />
                      <ChevronDown size={20} style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--text-muted)', pointerEvents: 'none'
                      }} />
                      {clienteSeleccionado && (
                        <span style={{
                          position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)',
                          background: 'var(--success)', color: 'white', padding: '2px 8px',
                          borderRadius: '4px', fontSize: '0.75rem'
                        }}>
                          ✓ Seleccionado
                        </span>
                      )}
                      {mostrarDropdownClientes && busquedaCliente.length >= 2 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          background: 'white', border: '1px solid var(--border)', borderTop: 'none',
                          borderRadius: '0 0 8px 8px', maxHeight: '220px', overflow: 'auto',
                          zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          {clientesFiltrados.length > 0 ? (
                            clientesFiltrados.map((cliente) => (
                              <div key={cliente.id}
                                onClick={() => seleccionarCliente(cliente)}
                                style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                              >
                                <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{cliente.razon_social}</div>
                                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>RUT: {cliente.rut || 'N/A'}</div>
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.85rem' }}>
                              No se encontraron clientes con "{busquedaCliente}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="of-form-grid" style={{ gridTemplateColumns: '2fr 1fr', marginTop: 10 }}>
                    <div className="of-f">
                      <label>Cliente</label>
                      <input
                        type="text"
                        placeholder="Nombre del cliente (opcional en cotización suelta)"
                        value={cotizacion.clienteRazonSocial}
                        onChange={(e) => setCotizacion({ ...cotizacion, clienteRazonSocial: upperInput(e) })}
                        disabled={soloLectura}
                      />
                    </div>
                    <div className="of-f">
                      <label>RUT</label>
                      <input
                        type="text"
                        placeholder="Ej: 12.345.678-9"
                        value={cotizacion.clienteRut}
                        onChange={(e) => setCotizacion({ ...cotizacion, clienteRut: formatearRutInput(e.target.value) })}
                        disabled={soloLectura}
                      />
                    </div>
                  </div>
                  <div ref={direccionClienteDropdownRef} className="of-f" style={{ marginTop: 10, position: 'relative' }}>
                    <label style={{ color: 'var(--primary)' }}>
                      <Search size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                      Buscar Dirección
                    </label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="ot-search"
                        placeholder="Escriba para buscar una dirección..."
                        value={busquedaDireccionCliente}
                        onChange={(e) => {
                          setBusquedaDireccionCliente(e.target.value);
                          setMostrarDropdownDireccionCliente(e.target.value.trim().length >= 2);
                        }}
                        onFocus={() => { if (busquedaDireccionCliente.trim().length >= 2) setMostrarDropdownDireccionCliente(true); }}
                        disabled={soloLectura}
                        style={{
                          flex: '1 1 200px', minWidth: '120px', padding: '2px 8px', border: '1.5px solid var(--border)',
                          borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: '#E0F2FE',
                          color: '#0D9488', fontWeight: 600
                        }}
                      />
                      {!soloLectura && String(cotizacion.clienteDireccion || "").trim() && (
                        cotizacion.clienteDireccionId ? (
                          <button
                            type="button"
                            onClick={() => abrirEditarDireccion('cliente', cotizacion.clienteDireccionId)}
                            title="Editar esta dirección en el mantenedor de Direcciones"
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                              background: 'var(--warning)', color: 'white', border: 'none',
                              padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                              fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
                            }}
                          >
                            <Pencil size={12} /> Editar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={registrarDireccionCliente}
                            title="Registrar esta dirección en el mantenedor de Direcciones si no existe"
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                              background: 'var(--success)', color: 'white', border: 'none',
                              padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                              fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
                            }}
                          >
                            <MapPin size={12} /> Registrar
                          </button>
                        )
                      )}
                    </div>
                    {mostrarDropdownDireccionCliente && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', border: '1px solid var(--border)', borderTop: 'none',
                        borderRadius: '0 0 8px 8px', maxHeight: '200px', overflow: 'auto',
                        zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        {direccionesClienteSugeridas.length > 0 ? (
                          direccionesClienteSugeridas.map((d) => (
                            <div key={d.id}
                              onClick={() => seleccionarDireccionClienteBusqueda(d)}
                              style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{d.direccion}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                                {[d.ciudad, d.comuna].filter(Boolean).join(' - ')}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No se encontraron direcciones
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="of-form-grid" style={{ gridTemplateColumns: '1.4fr 1fr 1fr', marginTop: 10 }}>
                    <div className="of-f">
                      <label>Dirección</label>
                      <input
                        type="text"
                        placeholder="Dirección del cliente"
                        value={cotizacion.clienteDireccion}
                        onChange={(e) => setCotizacion({ ...cotizacion, clienteDireccion: upperInput(e), clienteDireccionId: null })}
                        disabled={soloLectura}
                      />
                    </div>
                    <div className="of-f">
                      <label>Ciudad</label>
                      <input
                        type="text"
                        placeholder="Ciudad"
                        value={cotizacion.clienteCiudad}
                        onChange={(e) => setCotizacion({ ...cotizacion, clienteCiudad: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''), clienteDireccionId: null })}
                        disabled={soloLectura}
                      />
                    </div>
                    <div className="of-f">
                      <label>Comuna</label>
                      <input
                        type="text"
                        placeholder="Comuna"
                        value={cotizacion.clienteComuna}
                        onChange={(e) => setCotizacion({ ...cotizacion, clienteComuna: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''), clienteDireccionId: null })}
                        disabled={soloLectura}
                      />
                    </div>
                  </div>
                  <div className="of-form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))', marginTop: 10 }}>
                    <div className="of-f">
                      <label>Teléfono</label>
                      <input
                        type="tel"
                        placeholder="Teléfono del cliente"
                        value={cotizacion.clienteTelefono}
                        onChange={(e) => setCotizacion({ ...cotizacion, clienteTelefono: e.target.value.replace(/[^0-9+]/g, '') })}
                        disabled={soloLectura}
                      />
                    </div>
                    <div className="of-f">
                      <label>Email Cliente</label>
                      <input
                        type="email"
                        placeholder="Email del cliente"
                        value={cotizacion.clienteEmail}
                        onChange={(e) => setCotizacion({ ...cotizacion, clienteEmail: e.target.value })}
                        disabled={soloLectura}
                      />
                    </div>
                  </div>

                  <div className="of-form-grid" style={{ marginTop: 16, paddingTop: 10, borderTop: '2px solid #cbd5e1' }}>
                    <div className="of-f" style={{ position: 'relative' }} ref={contactoDropdownRef}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Search size={10} />Contacto</label>
                      <input
                        type="text"
                        placeholder="Escriba para buscar un contacto..."
                        value={busquedaContacto}
                        onChange={(e) => {
                          const v = upperInput(e);
                          setBusquedaContacto(v);
                          setCotizacion((prev) => ({ ...prev, contactoNombre: v, contactoId: null }));
                          setMostrarDropdownContacto(v.trim().length >= 2);
                        }}
                        onFocus={() => { if (busquedaContacto.trim().length >= 2) setMostrarDropdownContacto(true); }}
                        disabled={soloLectura}
                      />
                      {mostrarDropdownContacto && contactosSugeridos.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          background: 'white', border: '1px solid var(--border)', borderTop: 'none',
                          borderRadius: '0 0 8px 8px', maxHeight: '200px', overflow: 'auto',
                          zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          {contactosSugeridos.map((c) => (
                            <div key={c.id}
                              onClick={() => seleccionarContactoBusqueda(c)}
                              style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '.85rem' }}>
                                {c.nombre}
                              </div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                                {c.email ? `✉ ${c.email}` : ''}{c.fono ? ` | Tel: ${c.fono}` : ''}{c.cargo ? ` | ${c.cargo}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="of-f">
                      <label style={{ display: 'flex', alignItems: 'center' }}>Fono Contacto</label>
                      <input type="tel" placeholder="Teléfono del contacto" value={cotizacion.contactoFono} onChange={(e) => setCotizacion({ ...cotizacion, contactoFono: e.target.value.replace(/[^0-9+]/g, '') })} disabled={soloLectura} />
                    </div>
                    <div className="of-f">
                      <label style={{ display: 'flex', alignItems: 'center' }}>Email Contacto</label>
                      <input type="email" placeholder="Email del contacto" value={cotizacion.contactoEmail} onChange={(e) => setCotizacion({ ...cotizacion, contactoEmail: e.target.value })} disabled={soloLectura} />
                    </div>
                    <div className="of-f">
                      <label style={{ display: 'flex', alignItems: 'center' }}>Cargo Contacto</label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="text" placeholder="Cargo del contacto" value={cotizacion.contactoCargo} onChange={(e) => setCotizacion({ ...cotizacion, contactoCargo: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })} disabled={soloLectura} style={{ flex: '1 1 100px', minWidth: '80px' }} />
                        {!soloLectura && String(cotizacion.contactoNombre || "").trim() && (
                          cotizacion.contactoId ? (
                            <button
                              type="button"
                              onClick={() => abrirEditarContacto('principal', cotizacion.contactoId)}
                              title="Editar este contacto en el mantenedor de Contactos"
                              style={{
                                display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                                background: 'var(--warning)', color: 'white', border: 'none',
                                padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
                              }}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={async () => {
                                const resultado = await registrarOEnlazarContacto(cotizacion.contactoNombre, cotizacion.contactoEmail, cotizacion.contactoFono, cotizacion.contactoCargo);
                                if (!resultado) return;
                                alert(resultado.yaExistia
                                  ? `El contacto "${cotizacion.contactoNombre}" ya estaba en el mantenedor — se enlazó.`
                                  : `Contacto "${cotizacion.contactoNombre}" registrado en el mantenedor.`);
                                setCotizacion((prev) => ({ ...prev, contactoId: resultado.id }));
                              }}
                              title="Registrar este contacto en el mantenedor de Contactos si no existe"
                              style={{
                                display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                                background: 'var(--success)', color: 'white', border: 'none',
                                padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
                              }}
                            >
                              <Contact size={12} /> Registrar
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div ref={direccionBusqDropdownRef} className="of-f" style={{ marginTop: 4, marginBottom: '8px', position: 'relative' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Search size={10} />
                      Buscar Dirección
                    </label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="ot-search"
                        placeholder="Escriba para buscar una dirección..."
                        value={busquedaDireccion}
                        onChange={(e) => {
                          setBusquedaDireccion(e.target.value);
                          setMostrarDropdownDireccionBusq(e.target.value.trim().length >= 2);
                        }}
                        onFocus={() => { if (busquedaDireccion.trim().length >= 2) setMostrarDropdownDireccionBusq(true); }}
                        disabled={soloLectura}
                        style={{
                          flex: '1 1 200px', minWidth: '120px', padding: '2px 8px', border: '1.5px solid var(--border)',
                          borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: '#E0F2FE',
                          color: '#0D9488', fontWeight: 600
                        }}
                      />
                      {!soloLectura && String(cotizacion.contactoDireccion || "").trim() && (
                        cotizacion.direccionId ? (
                          <button
                            type="button"
                            onClick={() => abrirEditarDireccion('principal', cotizacion.direccionId)}
                            title="Editar esta dirección en el mantenedor de Direcciones"
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                              background: 'var(--warning)', color: 'white', border: 'none',
                              padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                              fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
                            }}
                          >
                            <Pencil size={12} /> Editar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={registrarDireccionContacto}
                            title="Registrar esta dirección en el mantenedor de Direcciones si no existe"
                            style={{
                              display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                              background: 'var(--success)', color: 'white', border: 'none',
                              padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                              fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
                            }}
                          >
                            <MapPin size={12} /> Registrar
                          </button>
                        )
                      )}
                    </div>
                    {mostrarDropdownDireccionBusq && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0,
                        background: 'white', border: '1px solid var(--border)', borderTop: 'none',
                        borderRadius: '0 0 8px 8px', maxHeight: '200px', overflow: 'auto',
                        zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}>
                        {direccionesSugeridas.length > 0 ? (
                          direccionesSugeridas.map((d) => (
                            <div key={d.id}
                              onClick={() => seleccionarDireccionBusqueda(d)}
                              style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{d.direccion}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                                {[d.ciudad, d.comuna].filter(Boolean).join(' - ')}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No se encontraron direcciones
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="of-form-grid" style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
                    <div className="of-f">
                      <label>Dirección</label>
                      <input type="text" placeholder="Dirección" value={cotizacion.contactoDireccion || ""} onChange={(e) => setCotizacion({ ...cotizacion, contactoDireccion: upperInput(e), direccionId: null })} disabled={soloLectura} />
                    </div>
                    <div className="of-f">
                      <label>Ciudad</label>
                      <input type="text" placeholder="Ciudad" value={cotizacion.contactoCiudad || ""} onChange={(e) => setCotizacion({ ...cotizacion, contactoCiudad: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''), direccionId: null })} disabled={soloLectura} />
                    </div>
                    <div className="of-f">
                      <label>Comuna</label>
                      <input type="text" placeholder="Comuna" value={cotizacion.contactoComuna || ""} onChange={(e) => setCotizacion({ ...cotizacion, contactoComuna: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''), direccionId: null })} disabled={soloLectura} />
                    </div>
                  </div>

                  {/* Otros Contactos (dinámicos), mismo patrón que la OT */}
                  <div style={{ marginTop: '10px', padding: '4px 10px', background: '#F0FDF4', border: '1px solid #7AD6EC', borderRadius: '8px', lineHeight: '1.2' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem', width: 'fit-content', maxWidth: '100%' }}>
                      {mostrarContactosExtra ? <ChevronUp size={14} style={{ color: 'var(--success)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />}
                      <input
                        type="checkbox"
                        className="of-check of-check--contactos"
                        checked={mostrarContactosExtra}
                        disabled={soloLectura && cotizacion.contactosExtra.length === 0}
                        onChange={(e) => {
                          setMostrarContactosExtra(e.target.checked);
                          if (!e.target.checked) setContactosResumenAbierto(false);
                        }}
                      />
                      <UserPlus size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
                      Otros Contactos
                      {cotizacion.contactosExtra.length > 0 && (
                        <span style={{
                          background: 'var(--success)', color: 'white', padding: '1px 8px', borderRadius: '10px',
                          fontSize: '0.75rem', fontWeight: '700'
                        }}>
                          {cotizacion.contactosExtra.length}
                        </span>
                      )}
                    </label>

                    {mostrarContactosExtra && (
                      <div style={{ marginTop: '10px' }}>
                        {(() => {
                          const actualizarContacto = (idx, campo, valor) => {
                            const arr = [...cotizacion.contactosExtra];
                            arr[idx] = { ...arr[idx], [campo]: valor };
                            if (campo === 'nombre') arr[idx].contactoId = null;
                            setCotizacion({ ...cotizacion, contactosExtra: arr });
                          };

                          // Agrega un contacto existente del catálogo global como nueva fila.
                          const agregarContactoDesdeBusqueda = (c) => {
                            const nuevoIdx = cotizacion.contactosExtra.length;
                            setCotizacion({
                              ...cotizacion,
                              contactosExtra: [...cotizacion.contactosExtra, {
                                nombre: c.nombre, email: c.email || "", fono: c.fono || "", cargo: c.cargo || "",
                                contactoId: c.id
                              }]
                            });
                            setContactosManualVisibles(new Set([nuevoIdx]));
                            setBusquedaContactoExtra("");
                            setMostrarDropdownContactoExtra(false);
                          };

                          const eliminarContacto = (idx) => {
                            const arr = cotizacion.contactosExtra.filter((_, i) => i !== idx);
                            setCotizacion({ ...cotizacion, contactosExtra: arr });
                            setContactosManualVisibles(prev => {
                              const next = new Set();
                              prev.forEach(i => {
                                if (i < idx) next.add(i);
                                else if (i > idx) next.add(i - 1);
                              });
                              return next;
                            });
                          };

                          // Evita crear a mano un contacto que ya existe: como Contacto principal
                          // de la cotización o en otra fila de Otros Contactos.
                          const nombreContactoDuplicado = (idx, valor) => {
                            const v = normTxt(valor);
                            if (!v) return false;
                            if (normTxt(cotizacion.contactoNombre) === v) return true;
                            if (cotizacion.contactosExtra.some((c, i) => i !== idx && normTxt(c.nombre) === v)) return true;
                            return false;
                          };

                          // Da de alta en el mantenedor de Contactos un contacto tipeado a mano
                          // en "Otros Contactos" que todavía no existe ahí.
                          const registrarContactoExtraEnContactos = async (contacto, idx) => {
                            const resultado = await registrarOEnlazarContacto(contacto.nombre, contacto.email, contacto.fono, contacto.cargo);
                            if (!resultado) return;
                            alert(resultado.yaExistia
                              ? `El contacto "${contacto.nombre}" ya estaba en el mantenedor — se enlazó.`
                              : `Contacto "${contacto.nombre}" registrado en el mantenedor.`);
                            setCotizacion((prev) => {
                              const arr = [...prev.contactosExtra];
                              arr[idx] = { ...arr[idx], contactoId: resultado.id };
                              return { ...prev, contactosExtra: arr };
                            });
                            setContactosManualVisibles(prev => {
                              const next = new Set(prev);
                              next.delete(idx);
                              return next;
                            });
                          };

                          return (
                            <>
                              {!soloLectura && (
                                <div ref={contactoExtraDropdownRef} className="of-f" style={{ position: 'relative', marginBottom: '10px' }}>
                                  <input
                                    type="text"
                                    placeholder="Buscar un contacto existente para agregarlo..."
                                    value={busquedaContactoExtra}
                                    onChange={(e) => {
                                      setBusquedaContactoExtra(e.target.value);
                                      setMostrarDropdownContactoExtra(e.target.value.trim().length >= 2);
                                    }}
                                    onFocus={() => { if (busquedaContactoExtra.trim().length >= 2) setMostrarDropdownContactoExtra(true); }}
                                  />
                                  {mostrarDropdownContactoExtra && (
                                    <div style={{
                                      position: 'absolute', top: '100%', left: 0, right: 0,
                                      background: 'white', border: '1px solid var(--border)', borderTop: 'none',
                                      borderRadius: '0 0 8px 8px', maxHeight: '200px', overflow: 'auto',
                                      zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                      {contactosExtraSugeridos.length > 0 ? (
                                        contactosExtraSugeridos.map((c) => (
                                          <div key={c.id}
                                            onClick={() => agregarContactoDesdeBusqueda(c)}
                                            style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                                          >
                                            <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.82rem' }}>{c.nombre}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                              {c.email ? `✉ ${c.email}` : ''}{c.fono ? ` | Tel: ${c.fono}` : ''}{c.cargo ? ` | ${c.cargo}` : ''}
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                          No se encontraron contactos
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {cotizacion.contactosExtra.length > 0 && !contactosResumenAbierto && (
                                <button
                                  type="button"
                                  onClick={() => setContactosResumenAbierto(true)}
                                  style={{
                                    background: 'none', color: 'var(--success)', border: '1px solid #7AD6EC',
                                    borderRadius: '6px', padding: '2px 10px', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '0.75rem', marginRight: '8px'
                                  }}
                                >
                                  {cotizacion.contactosExtra.length} contacto{cotizacion.contactosExtra.length > 1 ? 's' : ''} agregado{cotizacion.contactosExtra.length > 1 ? 's' : ''} — Ver
                                </button>
                              )}

                              {cotizacion.contactosExtra.length > 0 && contactosResumenAbierto && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                  {cotizacion.contactosExtra.map((_, idx) => {
                                    const activo = contactosManualVisibles.has(idx);
                                    return (
                                    <span key={idx} style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                                      background: activo ? 'var(--success)' : '#F0FDF4',
                                      color: activo ? '#ffffff' : 'var(--success)',
                                      border: '1px solid #7AD6EC',
                                      borderRadius: '999px', padding: '2px 6px 2px 10px', fontSize: '0.75rem', fontWeight: 600
                                    }}>
                                      <span
                                        onClick={() => setContactosManualVisibles(prev => (
                                          prev.has(idx) && prev.size === 1 ? new Set() : new Set([idx])
                                        ))}
                                        title="Editar contacto"
                                        style={{ cursor: 'pointer' }}
                                      >
                                        {/* +2: el contacto principal (fuera de esta lista) ya es "Contacto 1" */}
                                        {`Contacto ${idx + 2}`}
                                      </span>
                                      {!soloLectura && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!confirm("¿Seguro que desea eliminar este contacto?")) return;
                                            eliminarContacto(idx);
                                          }}
                                          title="Quitar contacto"
                                          style={{ background: 'none', border: 'none', color: activo ? '#ffffff' : 'var(--success)', cursor: 'pointer', display: 'flex', padding: 0 }}
                                        >
                                          <X size={12} />
                                        </button>
                                      )}
                                    </span>
                                    );
                                  })}
                                </div>
                              )}

                              {cotizacion.contactosExtra.map((c, idx) => {
                                if (!contactosManualVisibles.has(idx)) return null;
                                return (
                                <div key={idx} style={{ marginBottom: '6px', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px' }}>
                                  <div className="of-form-grid" style={{ gap: '8px' }}>
                                    <div className="of-f">
                                      <label>Contacto {idx + 2}</label>
                                      <input
                                        type="text"
                                        placeholder="Nombre"
                                        value={c.nombre}
                                        onChange={(e) => actualizarContacto(idx, 'nombre', upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))}
                                        onFocus={(e) => { nombreContactoEnFocoRef.current = e.target.value; }}
                                        onBlur={(e) => {
                                          if (e.target.value === nombreContactoEnFocoRef.current) return;
                                          if (nombreContactoDuplicado(idx, e.target.value)) {
                                            alert(`El contacto "${e.target.value.trim()}" ya existe en esta cotización.`);
                                            const arr = [...cotizacion.contactosExtra];
                                            arr[idx] = { ...arr[idx], nombre: '', email: '' };
                                            setCotizacion({ ...cotizacion, contactosExtra: arr });
                                          }
                                        }}
                                        disabled={soloLectura}
                                      />
                                    </div>
                                    <div className="of-f">
                                      <label>Email</label>
                                      <input type="email" placeholder="Email" value={c.email} onChange={(e) => actualizarContacto(idx, 'email', e.target.value)} disabled={soloLectura} />
                                    </div>
                                    <div className="of-f">
                                      <label>Fono</label>
                                      <input type="tel" placeholder="Fono" value={c.fono} onChange={(e) => actualizarContacto(idx, 'fono', e.target.value.replace(/[^0-9+]/g, ''))} disabled={soloLectura} />
                                    </div>
                                    <div className="of-f">
                                      <label>Cargo</label>
                                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input type="text" placeholder="Cargo" value={c.cargo} onChange={(e) => actualizarContacto(idx, 'cargo', upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))} disabled={soloLectura} style={{ flex: '1 1 120px', minWidth: '80px' }} />
                                        {!soloLectura && c.nombre.trim() && (
                                          c.contactoId ? (
                                            <button
                                              type="button"
                                              onClick={() => abrirEditarContacto(idx, c.contactoId)}
                                              title="Editar este contacto en el mantenedor de Contactos"
                                              style={{ background: '#FFF7ED', color: 'var(--warning)', border: '1px solid #FED7AA', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', lineHeight: '1.3', flexShrink: 0 }}
                                            >
                                              <Pencil size={12} style={{ verticalAlign: 'text-bottom' }} /> Editar
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => registrarContactoExtraEnContactos(c, idx)}
                                              title="Registrar este contacto en el mantenedor de Contactos si no existe"
                                              style={{ background: '#F0FDF4', color: 'var(--success)', border: '1px solid #7AD6EC', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', lineHeight: '1.3', flexShrink: 0 }}
                                            >
                                              <UserPlus size={12} style={{ verticalAlign: 'text-bottom' }} /> Registrar
                                            </button>
                                          )
                                        )}
                                        {!soloLectura && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (!confirm("¿Seguro que desea eliminar este contacto?")) return;
                                              eliminarContacto(idx);
                                            }}
                                            style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', lineHeight: '1.3', flexShrink: 0 }}
                                          >
                                            Quitar
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div ref={direccionExtraDropdownRef} className="of-f" style={{ marginTop: 6, position: 'relative' }}>
                                    <label style={{ color: 'var(--primary)' }}>
                                      <Search size={11} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                                      Buscar Dirección
                                    </label>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <input
                                        type="text"
                                        className="ot-search"
                                        placeholder="Escriba para buscar una dirección..."
                                        value={busquedaDireccionExtra}
                                        onChange={(e) => {
                                          setBusquedaDireccionExtra(e.target.value);
                                          setMostrarDropdownDireccionExtra(e.target.value.trim().length >= 2);
                                        }}
                                        onFocus={() => { if (busquedaDireccionExtra.trim().length >= 2) setMostrarDropdownDireccionExtra(true); }}
                                        disabled={soloLectura}
                                        style={{
                                          flex: '1 1 200px', minWidth: '120px', padding: '2px 8px', border: '1.5px solid var(--border)',
                                          borderRadius: 'var(--radius-sm)', fontSize: '.82rem', background: '#E0F2FE',
                                          color: '#0D9488', fontWeight: 600
                                        }}
                                      />
                                      {!soloLectura && String(c.direccion || "").trim() && (
                                        c.direccionId ? (
                                          <button
                                            type="button"
                                            onClick={() => abrirEditarDireccion(idx, c.direccionId)}
                                            title="Editar esta dirección en el mantenedor de Direcciones"
                                            style={{
                                              display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                                              background: 'var(--warning)', color: 'white', border: 'none',
                                              padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                                              fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
                                            }}
                                          >
                                            <Pencil size={12} /> Editar
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => registrarDireccionExtra(c, idx)}
                                            title="Registrar esta dirección en el mantenedor de Direcciones si no existe"
                                            style={{
                                              display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                                              background: 'var(--success)', color: 'white', border: 'none',
                                              padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                                              fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
                                            }}
                                          >
                                            <MapPin size={12} /> Registrar
                                          </button>
                                        )
                                      )}
                                    </div>
                                    {mostrarDropdownDireccionExtra && (
                                      <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: 'white', border: '1px solid var(--border)', borderTop: 'none',
                                        borderRadius: '0 0 8px 8px', maxHeight: '200px', overflow: 'auto',
                                        zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                      }}>
                                        {direccionesExtraSugeridas.length > 0 ? (
                                          direccionesExtraSugeridas.map((d) => (
                                            <div key={d.id}
                                              onClick={() => seleccionarDireccionExtraBusqueda(d, idx)}
                                              style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                                              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                                            >
                                              <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{d.direccion}</div>
                                              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                                                {[d.ciudad, d.comuna].filter(Boolean).join(' - ')}
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            No se encontraron direcciones
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="of-form-grid" style={{ gridTemplateColumns: '1.4fr 1fr 1fr', marginTop: 6 }}>
                                    <div className="of-f">
                                      <label>Dirección</label>
                                      <input type="text" placeholder="Dirección" value={c.direccion || ""} onChange={(e) => actualizarContacto(idx, 'direccion', upperInput(e))} disabled={soloLectura} />
                                    </div>
                                    <div className="of-f">
                                      <label>Ciudad</label>
                                      <input type="text" placeholder="Ciudad" value={c.ciudad || ""} onChange={(e) => actualizarContacto(idx, 'ciudad', upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))} disabled={soloLectura} />
                                    </div>
                                    <div className="of-f">
                                      <label>Comuna</label>
                                      <input type="text" placeholder="Comuna" value={c.comuna || ""} onChange={(e) => actualizarContacto(idx, 'comuna', upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))} disabled={soloLectura} />
                                    </div>
                                  </div>
                                </div>
                                );
                              })}

                              {!soloLectura && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nuevoIdx = cotizacion.contactosExtra.length;
                                    setCotizacion({
                                      ...cotizacion,
                                      contactosExtra: [...cotizacion.contactosExtra, { nombre: "", email: "", fono: "", cargo: "" }]
                                    });
                                    setContactosManualVisibles(new Set([nuevoIdx]));
                                  }}
                                  style={{
                                    marginTop: '6px',
                                    background: '#F0FDF4',
                                    color: 'var(--success)',
                                    border: '1px solid #7AD6EC',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  + Agregar contacto
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="of-sec success" style={{ marginTop: 8 }}>
                  <div className="of-st primary">Ejecutivo y Condiciones</div>
                  <div className="of-form-grid" style={{ marginBottom: 0 }}>
                    <div className="of-f">
                      <label>Ejecutivo</label>
                      <input type="text" value={cotizacion.ejecutivo} disabled />
                    </div>
                    <div className="of-f">
                      <label>Fono Ejecutivo</label>
                      <input type="tel" placeholder="Teléfono del ejecutivo" value={cotizacion.ejecutivoFono} onChange={(e) => setCotizacion({ ...cotizacion, ejecutivoFono: e.target.value.replace(/[^0-9+]/g, '') })} disabled={soloLectura} />
                    </div>
                    <div className="of-f">
                      <label>Email Ejecutivo</label>
                      <input type="email" placeholder="Email del ejecutivo" value={cotizacion.ejecutivoEmail} onChange={(e) => setCotizacion({ ...cotizacion, ejecutivoEmail: e.target.value })} disabled={soloLectura} />
                    </div>
                  </div>
                  <div className="of-form-grid" style={{ marginTop: 10 }}>
                    <div className="of-f">
                      <label>Emisión</label>
                      <input type="date" value={cotizacion.fechaEmision} onChange={(e) => setCotizacion({ ...cotizacion, fechaEmision: e.target.value })} disabled={soloLectura} required />
                    </div>
                    <div className="of-f">
                      <label>Válido hasta</label>
                      <input type="date" value={cotizacion.fechaValidoHasta} onChange={(e) => setCotizacion({ ...cotizacion, fechaValidoHasta: e.target.value })} disabled={soloLectura} />
                    </div>
                    <div className="of-f">
                      <label>Condición</label>
                      <select value={cotizacion.condicion} onChange={(e) => setCotizacion({ ...cotizacion, condicion: e.target.value })} disabled={soloLectura}>
                        <option value="Contado - CLP">Contado - CLP</option>
                        <option value="Crédito 30 días">Crédito 30 días</option>
                        <option value="Crédito 60 días">Crédito 60 días</option>
                        <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                        <option value="Contra entrega">Contra entrega</option>
                        <option value="Transferencia previa">Transferencia previa</option>
                        <option value="Orden de compra 30 días">Orden de compra 30 días</option>
                      </select>
                    </div>
                  </div>
                  <div className="of-f" style={{ marginTop: 10 }}>
                    <label>Glosa</label>
                    <textarea
                      placeholder="Información adicional de la cotización..."
                      value={cotizacion.glosa}
                      onChange={(e) => setCotizacion({ ...cotizacion, glosa: e.target.value })}
                      rows={3}
                      disabled={soloLectura}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
                </div>

                <div className="of-col-right" style={{ minWidth: 0 }}>
                <div className="of-sec primary">
                  <div className="of-st muted">Ítems</div>
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
                    marginTop: 6, marginBottom: 10, padding: '8px 10px',
                    background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px'
                  }}>
                    {!soloLectura && (
                      <button
                        type="button"
                        onClick={agregarItem}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'none', color: 'var(--success)', border: '1px solid var(--success)',
                          borderRadius: '6px', padding: '3px 12px', cursor: 'pointer',
                          fontWeight: 600, fontSize: '0.75rem'
                        }}
                      >
                        <Plus size={14} /> Agregar ítem
                      </button>
                    )}

                    {cotizacion.items.length > LIMITE_ITEMS && (
                      <button
                        type="button"
                        onClick={() => setItemsColapsado((v) => !v)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'none', color: 'var(--primary)', border: '1px solid var(--primary)',
                          borderRadius: '6px', padding: '3px 12px', cursor: 'pointer',
                          fontWeight: 600, fontSize: '0.75rem'
                        }}
                      >
                        {itemsColapsado ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                        {itemsColapsado ? 'Ver más' : 'Ver menos'}
                      </button>
                    )}
                  </div>

                  {(itemsColapsado ? cotizacion.items.slice(0, 1) : cotizacion.items)
                    .map((item, idx) => renderItemCard(item, itemsColapsado ? 0 : idx))}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                    <div style={{ minWidth: 220 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '.85rem' }}>
                        <span>Neto:</span><span>{clp(totales.neto)} CLP</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '.85rem' }}>
                        <span>IVA (19%):</span><span>{clp(totales.iva)} CLP</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', borderTop: '1px solid var(--border)', marginTop: 4 }}>
                        <span>Total:</span><span>{clp(totales.total)} CLP</span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
                </div>

                <div className="of-sub">
                  <button type="button" className="of-btn-c" onClick={cerrarFormulario}>
                    <X size={16} /> {soloLectura ? "Cerrar" : "Cancelar"}
                  </button>
                  {!soloLectura && (
                    <button type="button" className="of-btn-s" onClick={(e) => guardarCotizacion(e, true)} disabled={guardando}>
                      <Save size={16} /> {guardando ? "Guardando..." : (editingId ? "Guardar Cambios" : "Guardar")}
                    </button>
                  )}
                  {!soloLectura && (
                    <button type="submit" className="of-btn-p" disabled={guardando}>
                      <Save size={16} /> {guardando ? "Guardando..." : (editingId ? "Cerrar" : "Guardar Cotización")}
                    </button>
                  )}
                  {editingId && (
                    <button type="button" className="of-btn-c" onClick={generarPDFActual}>
                      <FileDown size={16} /> PDF
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

      {cotParaPDF && (
        <ModalOpcionesPDFCotizacion cot={cotParaPDF} onClose={() => setCotParaPDF(null)} />
      )}

      {contactoEnEdicion && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
        >
          <div style={{ maxHeight: '90vh', overflow: 'auto', width: '100%', maxWidth: '740px' }}>
            <ContactoFormulario
              contactoEditando={contactoEnEdicion}
              contactos={[]}
              onSave={guardarEdicionContacto}
              onCancel={() => { setContactoEnEdicion(null); setContactoEditTarget(null); }}
            />
          </div>
        </div>,
        document.body
      )}

      {direccionEnEdicion && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
        >
          <div style={{ maxHeight: '90vh', overflow: 'auto', width: '100%', maxWidth: '740px' }}>
            <DireccionFormulario
              direccionEditando={direccionEnEdicion}
              direcciones={[]}
              onSave={guardarEdicionDireccion}
              onCancel={() => { setDireccionEnEdicion(null); setDireccionEditTarget(null); }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Cotizaciones;
