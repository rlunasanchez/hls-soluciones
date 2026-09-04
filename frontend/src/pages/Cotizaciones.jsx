import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileSpreadsheet, Package, Users, UserCog, LogOut, FileText, ClipboardList, ShoppingCart, Home,
  Search, Save, X, Plus, Trash2, FileDown
} from "lucide-react";
import api from "../services/api";
import { getCached } from "../services/cache";
import { toUpper, cerrarSesion, upperInput, parseToken } from "../utils/helpers";
import "../styles/OrdenTrabajo.css";
import "../styles/ordenes-componentes.css";
import { EMPRESA } from "../utils/empresa";
import { generarHtmlCotizacion, tituloDocumentoCotizacion, calcularTotales } from "../utils/cotizacionDoc";
import { imprimirHtml } from "../utils/imprimir";
import CotizacionLista from "../components/cotizaciones/CotizacionLista";
import { usePaginaPersistente, useClampPagina } from "../hooks/usePaginacion";

const clp = (n) => Math.round(Number(n) || 0).toLocaleString("es-CL");

const itemVacio = () => ({ sku: "", detalle: "", cantidad: 1, unidad: "", neto: "" });

const cotizacionVacia = () => ({
  fechaEmision: new Date().toISOString().split("T")[0],
  fechaValidoHasta: "",
  condicion: "Contado - CLP",
  pais: "Chile",
  glosa: "",
  clienteId: null,
  clienteRut: "",
  clienteRazonSocial: "",
  contactoNombre: "",
  contactoFono: "",
  contactoEmail: "",
  ejecutivo: parseToken().usuario || "",
  ejecutivoFono: EMPRESA.fono,
  ejecutivoEmail: "",
  items: [itemVacio(), itemVacio()],
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

  const LIMITE_ITEMS = 2;
  const [itemsExpandidos, setItemsExpandidos] = useState(false);

  const [busquedaContacto, setBusquedaContacto] = useState("");
  const [mostrarDropdownContacto, setMostrarDropdownContacto] = useState(false);
  const contactoDropdownRef = useRef(null);

  const [cotizacion, setCotizacion] = useState(cotizacionVacia());
  // Distinto de cotizacion.ordenId: esto es "por dónde entré al formulario",
  // no "si esta cotización está asociada a una OT". Una cotización asociada a
  // una OT igual se puede abrir desde el propio listado de Cotizaciones (Ver/
  // Editar), y en ese caso Cancelar/cerrar debe quedarse en Cotizaciones.
  const [origenOT, setOrigenOT] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchClientes(controller.signal);
    fetchCotizaciones(controller.signal);
    return () => controller.abort();
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
          ...cotizacionVacia(),
          clienteId: orden.cliente_id || clienteMatch?.id || null,
          clienteRut: orden.rut || clienteMatch?.rut || "",
          clienteRazonSocial: toUpper(orden.cliente || ""),
          contactoNombre: toUpper(orden.contacto || ""),
          contactoFono: orden.fono_contacto || "",
          contactoEmail: orden.email_contacto || "",
          ordenId: orden.id,
          ordenNumero: orden.numero_orden || ""
        });
      } else {
        setBusquedaCliente(toUpper(clienteNav.razon_social || ""));
        setBusquedaContacto(toUpper(clienteNav.contacto_nombre || ""));
        setCotizacion({
          ...cotizacionVacia(),
          clienteId: clienteNav.id || null,
          clienteRut: clienteNav.rut || "",
          clienteRazonSocial: toUpper(clienteNav.razon_social || ""),
          contactoNombre: toUpper(clienteNav.contacto_nombre || ""),
          contactoFono: clienteNav.contacto_fono || "",
          contactoEmail: clienteNav.contacto_email || ""
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
      return Array.isArray(arr) && arr.length ? arr : [itemVacio(), itemVacio()];
    } catch {
      return [itemVacio(), itemVacio()];
    }
  };

  const abrirNueva = () => {
    setEditingId(null);
    setSoloLectura(false);
    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setBusquedaContacto("");
    setItemsExpandidos(false);
    setOrigenOT(false);
    setCotizacion(cotizacionVacia());
    setMostrarFormulario(true);
  };

  const cargarCotizacion = async (cot, readOnly) => {
    const res = await api.get(`/api/cotizaciones/${cot.id}`);
    const c = res.data;
    setEditingId(c.id);
    setSoloLectura(readOnly);
    setOrigenOT(false);
    const cl = clientes.find((x) => x.id === c.cliente_id);
    setClienteSeleccionado(cl || null);
    setBusquedaCliente(c.cliente_razon_social || "");
    setBusquedaContacto(c.contacto_nombre || "");
    setItemsExpandidos(false);
    setCotizacion({
      fechaEmision: (c.fecha_emision || "").substring(0, 10),
      fechaValidoHasta: (c.fecha_valido_hasta || "").substring(0, 10),
      condicion: c.condicion || "",
      pais: c.pais || "",
      glosa: c.glosa || "",
      clienteId: c.cliente_id || null,
      clienteRut: c.cliente_rut || "",
      clienteRazonSocial: c.cliente_razon_social || "",
      contactoNombre: c.contacto_nombre || "",
      contactoFono: c.contacto_fono || "",
      contactoEmail: c.contacto_email || "",
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
    setMostrarFormulario(false);
    setEditingId(null);
    setSoloLectura(false);
    setCotizacion(cotizacionVacia());
    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setBusquedaContacto("");
    setItemsExpandidos(false);
    setOrigenOT(false);
    if (vuelveAOT) navigate("/orden-trabajo");
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
      contactoNombre: toUpper(cliente.contacto_nombre || ""),
      contactoFono: cliente.contacto_fono || "",
      contactoEmail: cliente.contacto_email || ""
    }));
  };

  const qCliente = busquedaCliente.toLowerCase();
  const clientesFiltrados = busquedaCliente.length >= 2 && (!clienteSeleccionado || toUpper(clienteSeleccionado.razon_social) !== busquedaCliente)
    ? clientes.filter((c) => c.razon_social?.toLowerCase().includes(qCliente) || c.codigo?.toLowerCase().includes(qCliente)).slice(0, 10)
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
      contactoFono: c.fono || ""
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
    setCotizacion((prev) => ({ ...prev, items: [...prev.items, itemVacio()] }));
    setItemsExpandidos(true);
  };
  const quitarItem = (idx) => setCotizacion((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const totales = calcularTotales(cotizacion.items);

  const guardarCotizacion = async (e, mantener = false) => {
    e.preventDefault();
    if (guardandoRef.current) return;

    const payload = {
      ...cotizacion,
      items: cotizacion.items.filter((i) =>
        String(i.sku || "").trim() || String(i.detalle || "").trim() || String(i.unidad || "").trim() || Number(i.neto) > 0
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

      if (mantener) {
        await cargarCotizacion({ id: idActual }, false);
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
      <div className="page-content">
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
                  <div className="of-st success">Cliente</div>
                  <div className="of-form-grid" style={{ marginTop: 10 }}>
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
                  </div>
                  <div className="of-form-grid" style={{ marginTop: 10, marginBottom: 0 }}>
                    <div className="of-f">
                      <label style={{ display: 'flex', alignItems: 'center' }}>Email Contacto</label>
                      <input type="email" placeholder="Email del contacto" value={cotizacion.contactoEmail} onChange={(e) => setCotizacion({ ...cotizacion, contactoEmail: e.target.value })} disabled={soloLectura} />
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
                      <label>Condición</label>
                      <input type="text" placeholder="Condición de pago" value={cotizacion.condicion} onChange={(e) => setCotizacion({ ...cotizacion, condicion: e.target.value })} disabled={soloLectura} />
                    </div>
                    <div className="of-f">
                      <label>País</label>
                      <input type="text" placeholder="País del cliente" value={cotizacion.pais} onChange={(e) => setCotizacion({ ...cotizacion, pais: upperInput(e) })} disabled={soloLectura} />
                    </div>
                    <div className="of-f">
                      <label>Emisión</label>
                      <input type="date" value={cotizacion.fechaEmision} onChange={(e) => setCotizacion({ ...cotizacion, fechaEmision: e.target.value })} disabled={soloLectura} required />
                    </div>
                    <div className="of-f">
                      <label>Válido hasta</label>
                      <input type="date" value={cotizacion.fechaValidoHasta} onChange={(e) => setCotizacion({ ...cotizacion, fechaValidoHasta: e.target.value })} disabled={soloLectura} />
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
                  {cotizacion.items.slice(0, itemsExpandidos ? cotizacion.items.length : LIMITE_ITEMS).map((item, idx) => {
                    const totalFila = (Number(item.cantidad) || 0) * (Number(item.neto) || 0);
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
                      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <div className="of-f" style={{ flex: '0 0 120px' }}>
                          <label>SKU</label>
                          <input type="text" value={item.sku} onChange={(e) => actualizarItem(idx, 'sku', e.target.value)} disabled={soloLectura} />
                        </div>
                        <div className="of-f" style={{ flex: '0 0 90px' }}>
                          <label>Cant.</label>
                          <input type="number" min="0" value={item.cantidad} onChange={(e) => actualizarItem(idx, 'cantidad', e.target.value)} disabled={soloLectura} />
                        </div>
                        <div className="of-f" style={{ flex: '0 0 90px' }}>
                          <label>Uni.</label>
                          <input type="text" value={item.unidad} onChange={(e) => actualizarItem(idx, 'unidad', e.target.value)} disabled={soloLectura} />
                        </div>
                        <div className="of-f" style={{ flex: '0 0 120px' }}>
                          <label>Neto</label>
                          <input type="number" min="0" value={item.neto} onChange={(e) => actualizarItem(idx, 'neto', e.target.value)} disabled={soloLectura} />
                        </div>
                        <div className="of-f" style={{ flex: '0 0 110px' }}>
                          <label>Total</label>
                          <input type="text" value={`${clp(totalFila)} CLP`} disabled />
                        </div>
                      </div>
                      <div className="of-f">
                        <label>Detalle</label>
                        <textarea rows={2} placeholder="Ej: Visita técnica" value={item.detalle} onChange={(e) => actualizarItem(idx, 'detalle', upperInput(e))} disabled={soloLectura}
                          style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                      </div>
                    </div>
                    );
                  })}
                  {cotizacion.items.length > LIMITE_ITEMS && (
                    <div style={{ marginTop: '4px', marginBottom: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setItemsExpandidos(!itemsExpandidos)}
                        style={{
                          background: 'none',
                          color: 'var(--primary)',
                          border: '1px solid var(--primary)',
                          borderRadius: '6px',
                          padding: '2px 10px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        {itemsExpandidos ? 'Ver menos' : `Ver todos (${cotizacion.items.length})`}
                      </button>
                    </div>
                  )}
                  {!soloLectura && (
                    <button type="button" className="of-btn-a" onClick={agregarItem} style={{ marginTop: 4 }}>
                      <Plus size={14} /> Agregar ítem
                    </button>
                  )}

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
    </div>
  );
}

export default Cotizaciones;
