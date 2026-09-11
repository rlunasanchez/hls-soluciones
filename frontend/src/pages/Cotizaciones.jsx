import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileSpreadsheet, Package, Users, UserCog, LogOut, FileText, ClipboardList, ShoppingCart, Home,
  Search, Save, X, Plus, Trash2, FileDown, ChevronUp, ChevronDown
} from "lucide-react";
import api from "../services/api";
import { getCached, invalidar } from "../services/cache";
import { toUpper, cerrarSesion, upperInput, parseToken, formatearRutInput } from "../utils/helpers";
import "../styles/OrdenTrabajo.css";
import "../styles/ordenes-componentes.css";
import { EMPRESA } from "../utils/empresa";
import { generarHtmlCotizacion, tituloDocumentoCotizacion, calcularTotales } from "../utils/cotizacionDoc";
import { imprimirHtml } from "../utils/imprimir";
import CotizacionLista from "../components/cotizaciones/CotizacionLista";
import { usePaginaPersistente, useClampPagina } from "../hooks/usePaginacion";

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
  clienteTelefono: "",
  clienteEmail: "",
  contactoNombre: "",
  contactoFono: "",
  contactoEmail: "",
  contactoCargo: "",
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
  const [itemsResumenAbierto, setItemsResumenAbierto] = useState(false);
  const [itemsManualVisibles, setItemsManualVisibles] = useState(() => new Set());

  const [busquedaContacto, setBusquedaContacto] = useState("");
  const [mostrarDropdownContacto, setMostrarDropdownContacto] = useState(false);
  const contactoDropdownRef = useRef(null);

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
          clienteTelefono: orden.fono_principal || clienteMatch?.telefono || "",
          clienteEmail: orden.email || clienteMatch?.email || "",
          contactoNombre: toUpper(orden.contacto || ""),
          contactoFono: orden.fono_contacto || "",
          contactoEmail: orden.email_contacto || "",
          contactoCargo: toUpper(orden.cargo_contacto || ""),
          ordenId: orden.id,
          ordenNumero: orden.numero_orden || ""
        });
      } else {
        setBusquedaCliente(toUpper(clienteNav.razon_social || ""));
        setBusquedaContacto(toUpper(clienteNav.contacto_nombre || ""));
        setCotizacion({
          ...nuevaCotizacion(),
          clienteId: clienteNav.id || null,
          clienteRut: clienteNav.rut || "",
          clienteRazonSocial: toUpper(clienteNav.razon_social || ""),
          clienteDireccion: toUpper(clienteNav.direccion || ""),
          clienteCiudad: toUpper(clienteNav.ciudad || ""),
          clienteComuna: toUpper(clienteNav.comuna || ""),
          clienteTelefono: clienteNav.telefono || "",
          clienteEmail: clienteNav.email || "",
          contactoNombre: toUpper(clienteNav.contacto_nombre || ""),
          contactoFono: clienteNav.contacto_fono || "",
          contactoEmail: clienteNav.contacto_email || "",
          contactoCargo: toUpper(clienteNav.contacto_cargo || "")
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

  const abrirNueva = async () => {
    await cargarPerfil();
    setEditingId(null);
    setSoloLectura(false);
    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setBusquedaContacto("");
    setItemsResumenAbierto(false);
    setItemsManualVisibles(new Set());
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
    setItemsResumenAbierto(false);
    setItemsManualVisibles(new Set());
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
      clienteTelefono: c.cliente_telefono || "",
      clienteEmail: c.cliente_email || "",
      contactoNombre: c.contacto_nombre || "",
      contactoFono: c.contacto_fono || "",
      contactoEmail: c.contacto_email || "",
      contactoCargo: c.contacto_cargo || "",
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
    imprimirHtml(generarHtmlCotizacion(cot), tituloDocumentoCotizacion(cot));
  };

  const generarPDFActual = async () => {
    if (!editingId) return;
    const res = await api.get(`/api/cotizaciones/${editingId}`);
    generarPDF(res.data);
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
    setItemsResumenAbierto(false);
    setItemsManualVisibles(new Set());
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
    setBusquedaContacto(toUpper(cliente.contacto_nombre || ""));
    setCotizacion((prev) => ({
      ...prev,
      clienteId: cliente.id,
      clienteRut: cliente.rut || "",
      clienteRazonSocial: toUpper(cliente.razon_social),
      clienteDireccion: toUpper(cliente.direccion || ""),
      clienteCiudad: toUpper(cliente.ciudad || ""),
      clienteComuna: toUpper(cliente.comuna || ""),
      clienteTelefono: cliente.telefono || "",
      clienteEmail: cliente.email || "",
      contactoNombre: toUpper(cliente.contacto_nombre || ""),
      contactoFono: cliente.contacto_fono || "",
      contactoEmail: cliente.contacto_email || "",
      contactoCargo: toUpper(cliente.contacto_cargo || "")
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

  // Contactos disponibles para buscar: el principal (contacto_nombre/email/fono
  // en la ficha del cliente) más los adicionales (clientes_contactos, empaquetados
  // en el campo agregado "contactos"), mismo patrón que el buscador de la OT.
  // Si hay un cliente asociado, se busca solo entre sus contactos; si es una
  // cotización suelta (sin cliente), se busca entre los de todos los clientes.
  const contactosDeCliente = (cli) => {
    const principalNombre = String(cli.contacto_nombre || "").toUpperCase().trim();
    const principalEmail = String(cli.contacto_email || "").toUpperCase().trim();
    const extras = String(cli.contactos || "")
      .split(";;")
      .map((c) => {
        const p = c.split("|");
        return { nombre: (p[0] || "").toUpperCase().trim(), email: p[1] || "", fono: p[2] || "", cargo: p[3] || "", cliente: cli.razon_social || "" };
      })
      .filter((c) => c.nombre)
      .filter((c) => {
        const n = c.nombre.toUpperCase().trim();
        const e = (c.email || "").toUpperCase().trim();
        if (principalNombre && n === principalNombre) return false;
        if (principalEmail && e && e === principalEmail) return false;
        return true;
      });
    const principal = principalNombre
      ? [{
          nombre: principalNombre,
          email: cli.contacto_email || "",
          fono: cli.contacto_fono || "",
          cargo: cli.contacto_cargo || "",
          cliente: cli.razon_social || "",
          principal: true
        }]
      : [];
    return [...principal, ...extras];
  };

  const contactosDisponibles = clienteSeleccionado
    ? contactosDeCliente(clienteSeleccionado)
    : clientes.flatMap(contactosDeCliente);

  const contactosFiltrados = busquedaContacto.trim().length >= 2
    ? contactosDisponibles.filter((c) => {
        const q = busquedaContacto.toUpperCase();
        return (c.nombre || "").includes(q) || (c.email || "").toUpperCase().includes(q);
      })
    : [];

  const seleccionarContactoBusqueda = (c) => {
    setCotizacion((prev) => ({
      ...prev,
      contactoNombre: c.nombre,
      contactoEmail: c.email || "",
      contactoFono: c.fono || "",
      contactoCargo: c.cargo || ""
    }));
    setBusquedaContacto(c.nombre);
    setMostrarDropdownContacto(false);
  };

  const actualizarItem = (idx, campo, valor) => {
    setCotizacion((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [campo]: valor };
      return { ...prev, items };
    });
  };

  const agregarItem = () => {
    // Mismo criterio que Sucursales/Contactos: el nuevo ítem pasa a ser
    // el que se muestra en el espacio único, reemplazando al que estaba.
    const nuevoIdx = cotizacion.items.length;
    setCotizacion((prev) => ({ ...prev, items: [...prev.items, itemVacio()] }));
    setItemsManualVisibles(new Set([nuevoIdx]));
  };
  const quitarItem = (idx) => {
    if (!window.confirm(`¿Eliminar el Ítem ${idx + 1}?`)) return;
    setCotizacion((prev) => {
      const restantes = prev.items.filter((_, i) => i !== idx);
      // Nunca dejar la lista vacía: el formulario siempre muestra el Ítem 1.
      const items = restantes.length ? restantes : [itemVacio()];
      if (items.length <= LIMITE_ITEMS) setItemsResumenAbierto(false);
      return { ...prev, items };
    });
    setItemsManualVisibles(prev => {
      const next = new Set();
      prev.forEach(i => {
        if (i < idx) next.add(i);
        else if (i > idx) next.add(i - 1);
      });
      return next;
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
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
        </div>
        <div className="of-f">
          <label>Detalle</label>
          <textarea rows={2} placeholder="Ej: Visita técnica" value={item.detalle} onChange={(e) => actualizarItem(idx, 'detalle', upperInput(e))} disabled={soloLectura}
            style={{ resize: 'vertical', fontFamily: 'inherit' }} />
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

                <div className="of-cols">
                <div className="of-col-left">
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
                  <div className="of-form-grid" style={{ gridTemplateColumns: '1.4fr 1fr 1fr', marginTop: 10 }}>
                    <div className="of-f">
                      <label>Dirección</label>
                      <input
                        type="text"
                        placeholder="Dirección del cliente"
                        value={cotizacion.clienteDireccion}
                        onChange={(e) => setCotizacion({ ...cotizacion, clienteDireccion: upperInput(e) })}
                        disabled={soloLectura}
                      />
                    </div>
                    <div className="of-f">
                      <label>Ciudad</label>
                      <input
                        type="text"
                        placeholder="Ciudad"
                        value={cotizacion.clienteCiudad}
                        onChange={(e) => setCotizacion({ ...cotizacion, clienteCiudad: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })}
                        disabled={soloLectura}
                      />
                    </div>
                    <div className="of-f">
                      <label>Comuna</label>
                      <input
                        type="text"
                        placeholder="Comuna"
                        value={cotizacion.clienteComuna}
                        onChange={(e) => setCotizacion({ ...cotizacion, clienteComuna: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })}
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
                        placeholder={contactosDisponibles.length ? "Escriba para buscar o cambiar..." : "Nombre del contacto"}
                        value={busquedaContacto}
                        onChange={(e) => {
                          const v = upperInput(e);
                          setBusquedaContacto(v);
                          setCotizacion((prev) => ({ ...prev, contactoNombre: v }));
                          setMostrarDropdownContacto(v.trim().length >= 2);
                        }}
                        onFocus={() => { if (busquedaContacto.trim().length >= 2) setMostrarDropdownContacto(true); }}
                        disabled={soloLectura}
                      />
                      {mostrarDropdownContacto && contactosFiltrados.length > 0 && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          background: 'white', border: '1px solid var(--border)', borderTop: 'none',
                          borderRadius: '0 0 8px 8px', maxHeight: '200px', overflow: 'auto',
                          zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          {contactosFiltrados.map((c, idx) => (
                            <div key={idx}
                              onClick={() => seleccionarContactoBusqueda(c)}
                              style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                            >
                              <div style={{ fontWeight: 600, fontSize: '.85rem' }}>
                                {c.nombre}
                                {!c.principal && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> (adicional)</span>}
                              </div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                                {!clienteSeleccionado && c.cliente ? `${c.cliente} | ` : ''}{c.email ? `✉ ${c.email}` : ''}{c.fono ? ` | Tel: ${c.fono}` : ''}{c.cargo ? ` | ${c.cargo}` : ''}
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
                      <input type="text" placeholder="Cargo del contacto" value={cotizacion.contactoCargo} onChange={(e) => setCotizacion({ ...cotizacion, contactoCargo: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '') })} disabled={soloLectura} />
                    </div>
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

                <div className="of-col-right">
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

                    {cotizacion.items.length > LIMITE_ITEMS &&
                      (itemsResumenAbierto || cotizacion.items.some((_, i) => !itemsManualVisibles.has(i))) && (
                      <button
                        type="button"
                        onClick={() => {
                          const abrir = !itemsResumenAbierto;
                          setItemsResumenAbierto(abrir);
                          if (!abrir) setItemsManualVisibles(new Set());
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: 'none', color: 'var(--primary)', border: '1px solid var(--primary)',
                          borderRadius: '6px', padding: '3px 12px', cursor: 'pointer',
                          fontWeight: 600, fontSize: '0.75rem'
                        }}
                      >
                        {itemsResumenAbierto ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {itemsResumenAbierto
                          ? 'Ver menos'
                          : `${cotizacion.items.length - LIMITE_ITEMS} ítem${cotizacion.items.length - LIMITE_ITEMS > 1 ? 's' : ''} más — Ver`}
                      </button>
                    )}

                    {cotizacion.items.length > LIMITE_ITEMS && (() => {
                      const todosActivos = itemsManualVisibles.size === cotizacion.items.length;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (todosActivos) {
                              setItemsManualVisibles(new Set());
                            } else {
                              // Al activar "Ver todos" sin haber tocado "Ver más" antes,
                              // conviene abrir el resumen también para que se vea la
                              // fila de chips por ítem debajo.
                              setItemsManualVisibles(new Set(cotizacion.items.map((_, i) => i)));
                              setItemsResumenAbierto(true);
                            }
                          }}
                          title={todosActivos ? "Ver solo un ítem a la vez" : "Ver todos los ítems"}
                          style={{
                            display: 'inline-flex', alignItems: 'center', cursor: 'pointer',
                            background: todosActivos ? 'var(--secondary)' : 'none',
                            color: todosActivos ? '#ffffff' : 'var(--secondary)',
                            border: '1px solid var(--secondary)',
                            borderRadius: '6px', padding: '3px 12px', fontSize: '0.75rem', fontWeight: 600
                          }}
                        >
                          Ver todos
                        </button>
                      );
                    })()}
                  </div>

                  {cotizacion.items.length > LIMITE_ITEMS && itemsResumenAbierto && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {cotizacion.items.map((_, idx) => {
                        const activo = itemsManualVisibles.size > 0 ? itemsManualVisibles.has(idx) : idx === 0;
                        return (
                          <span key={idx} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: activo ? 'var(--primary)' : 'var(--primary-light)',
                            color: activo ? '#ffffff' : 'var(--primary)',
                            border: '1px solid var(--primary)',
                            borderRadius: 999, padding: '2px 6px 2px 10px', fontSize: '.75rem', fontWeight: 600
                          }}>
                            <span
                              onClick={() => setItemsManualVisibles(prev => (
                                // Exclusivo: pinchar un ítem muestra solo ese (no se
                                // van acumulando hacia abajo). Pinchar el mismo lo cierra.
                                prev.has(idx) && prev.size === 1 ? new Set() : new Set([idx])
                              ))}
                              title="Editar ítem"
                              style={{ cursor: 'pointer' }}
                            >
                              {`Ítem ${idx + 1}`}
                            </span>
                            {!soloLectura && (
                              <button
                                type="button"
                                onClick={() => quitarItem(idx)}
                                title="Quitar ítem"
                                style={{ background: 'none', border: 'none', color: activo ? '#ffffff' : 'var(--primary)', cursor: 'pointer', display: 'flex', padding: 0 }}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {(() => {
                    // Por defecto un solo espacio visible (el Ítem 1). Si se elige
                    // un ítem puntual desde los chips, se muestra ese en su lugar;
                    // si se pincha "Ver todos", se muestran todas las tarjetas.
                    const pedidos = itemsManualVisibles.size > 0 ? [...itemsManualVisibles].sort((a, b) => a - b) : [0];
                    const visibles = pedidos.filter((idx) => idx >= 0 && idx < cotizacion.items.length);
                    if (visibles.length === 0) visibles.push(0);
                    return visibles.map((idx) => renderItemCard(cotizacion.items[idx], idx));
                  })()}

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
    </div>
  );
}

export default Cotizaciones;
