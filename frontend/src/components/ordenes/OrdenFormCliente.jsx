import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Users, Contact, ChevronDown, ChevronUp, Eye, UserPlus, MapPin, Paperclip, MoreVertical, Download, Trash2, FileText, Printer, Pencil, X } from "lucide-react";
import ClienteFormulario from "../clientes/ClienteFormulario";
import ContactoFormulario from "../contactos/ContactoFormulario";
import DireccionFormulario from "../direcciones/DireccionFormulario";
import "../../styles/Clientes.css";
import "../../styles/Contactos.css";
import "../../styles/Direcciones.css";
import { upperInput, validarRUT, formatearRutInput, toUpper, normalizarRut } from "../../utils/helpers";
import api from "../../services/api";

function OrdenFormCliente({
  busquedaCliente, setBusquedaCliente,
  mostrarDropdownClientes, setMostrarDropdownClientes,
  clienteSeleccionado,
  clientesFiltrados,
  clienteDropdownRef,
  seleccionarCliente,
  nuevaOrden, setNuevaOrden,
  clientes = [],
  clienteInactivo = false,
  clienteFijo = false,
  readOnly = false,
  setClienteSeleccionado,
  onClientesRefresh,
  seccionActiva = 'cliente'
}) {
  const [rutError, setRutError] = useState("");
  const [mostrarContactosExtra, setMostrarContactosExtra] = useState(false);
  const [contactosResumenAbierto, setContactosResumenAbierto] = useState(false);
  // Mismo patrón que direccionesManualVisibles pero para Otros Contactos.
  const [contactosManualVisibles, setContactosManualVisibles] = useState(() => new Set());
  const [busquedaContacto, setBusquedaContacto] = useState("");
  const [mostrarDropdownContacto, setMostrarDropdownContacto] = useState(false);
  const contactoDropdownRef = useRef(null);
  // Buscador para agregar un contacto existente a "Otros Contactos" (mismo
  // catálogo global que el buscador del Contacto principal).
  const [busquedaContactoExtra, setBusquedaContactoExtra] = useState("");
  const [mostrarDropdownContactoExtra, setMostrarDropdownContactoExtra] = useState(false);
  const contactoExtraDropdownRef = useRef(null);
  const [contactoEnEdicion, setContactoEnEdicion] = useState(null);
  // 'principal' o el índice de la fila en contactosExtra que se está editando.
  const [contactoEditTarget, setContactoEditTarget] = useState(null);
  // Buscador de Dirección (mantenedor de Direcciones), catálogo global —
  // mismo patrón que Contacto, un solo slot ligado al contacto principal.
  const [busquedaDireccion, setBusquedaDireccion] = useState("");
  const [mostrarDropdownDireccionBusq, setMostrarDropdownDireccionBusq] = useState(false);
  const [direccionesSugeridas, setDireccionesSugeridas] = useState([]);
  const direccionBusqDropdownRef = useRef(null);
  const [direccionEnEdicion, setDireccionEnEdicion] = useState(null);
  // 'principal', 'cliente' o el índice de la fila en contactosExtra que se
  // está editando.
  const [direccionEditTarget, setDireccionEditTarget] = useState(null);
  // Buscador de Dirección del Cliente (la "primera dirección"): mismo
  // catálogo global, ya no se ingresa a mano en el mantenedor de Cliente.
  const [busquedaDireccionCliente, setBusquedaDireccionCliente] = useState("");
  const [mostrarDropdownDireccionCliente, setMostrarDropdownDireccionCliente] = useState(false);
  const [direccionesClienteSugeridas, setDireccionesClienteSugeridas] = useState([]);
  const direccionClienteDropdownRef = useRef(null);
  // Buscador de Dirección dentro de una fila de "Otros Contactos". Solo una
  // fila está visible a la vez (ver contactosManualVisibles), así que un
  // único slot compartido alcanza — igual que el de arriba pero para extras.
  const [busquedaDireccionExtra, setBusquedaDireccionExtra] = useState("");
  const [mostrarDropdownDireccionExtra, setMostrarDropdownDireccionExtra] = useState(false);
  const [direccionesExtraSugeridas, setDireccionesExtraSugeridas] = useState([]);
  const direccionExtraDropdownRef = useRef(null);
  const nombreContactoEnFocoRef = useRef("");
  const [mostrarEditarClienteModal, setMostrarEditarClienteModal] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState(null);
  const [mostrarRegistrarCliente, setMostrarRegistrarCliente] = useState(false);
  const [prefillCliente, setPrefillCliente] = useState(null);
  const [mostrarInfoInterna, setMostrarInfoInterna] = useState(false);
  const [mostrarAdjunto, setMostrarAdjunto] = useState(false);
  const [mostrarMenuAdjunto, setMostrarMenuAdjunto] = useState(false);
  const [adjuntoParaVer, setAdjuntoParaVer] = useState(null);
  const [posAdjunto, setPosAdjunto] = useState({ top: 0, left: 0 });
  const adjuntoDropdownRef = useRef(null);
  const adjuntoIdxRef = useRef(-1);
  const btnAdjuntoRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (adjuntoDropdownRef.current && adjuntoDropdownRef.current.contains(event.target)) return;
      if (event.target.closest(".acciones-menu-btn")) return;
      setMostrarMenuAdjunto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!mostrarMenuAdjunto || !btnAdjuntoRef.current || !adjuntoDropdownRef.current) return;
    const rect = btnAdjuntoRef.current.getBoundingClientRect();
    const menuHeight = adjuntoDropdownRef.current.offsetHeight;
    const menuWidth = 140;
    const left = Math.min(Math.max(rect.right - menuWidth, 4), window.innerWidth - menuWidth);
    let top = rect.bottom + 4;
    if (top + menuHeight > window.innerHeight) {
      top = Math.max(rect.top - menuHeight - 4, 4);
    }
    setPosAdjunto({ top, left });
  }, [mostrarMenuAdjunto]);

  const TIPOS_PERMITIDOS = ["image/", "application/pdf"];

  const handleAdjuntoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const actuales = nuevaOrden.adjuntos || [];
    if (actuales.length >= 2) {
      alert("Máximo 2 archivos adjuntos por orden.");
      e.target.value = "";
      return;
    }
    const permitido = TIPOS_PERMITIDOS.some((t) => file.type.startsWith(t)) || file.type === "application/pdf";
    if (!permitido) {
      alert("Solo se permiten imágenes (JPG, PNG, etc.) o PDF.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo supera el máximo de 5MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNuevaOrden({ ...nuevaOrden, adjuntos: [...actuales, { nombre: file.name, tipo: file.type, data: reader.result }] });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const abrirMenuAdjunto = (e, idx) => {
    e.stopPropagation();
    if (mostrarMenuAdjunto && adjuntoIdxRef.current === idx) {
      setMostrarMenuAdjunto(false);
      return;
    }
    adjuntoIdxRef.current = idx;
    btnAdjuntoRef.current = e.currentTarget;
    setMostrarMenuAdjunto(true);
  };

  const descargarAdjunto = (idx = adjuntoIdxRef.current) => {
    const adj = (nuevaOrden.adjuntos || [])[idx];
    if (!adj) return;
    const a = document.createElement("a");
    a.href = adj.data;
    a.download = adj.nombre || `adjunto-ot-${(nuevaOrden.numeroOrden || "").replace(/\s+/g, "-") || "archivo"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setMostrarMenuAdjunto(false);
  };

  const verAdjunto = (idx = adjuntoIdxRef.current) => {
    const adj = (nuevaOrden.adjuntos || [])[idx];
    if (!adj) return;
    setAdjuntoParaVer(adj);
    setMostrarMenuAdjunto(false);
  };

  const imprimirAdjunto = () => {
    if (!adjuntoParaVer || adjuntoParaVer.tipo === "application/pdf") return;
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.style.visibility = "hidden";
    document.body.appendChild(frame);
    const doc = frame.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(
      `<html><head><title>${adjuntoParaVer.nombre || "Adjunto"}</title></head>` +
      `<body style="margin:0;text-align:center;"><img src="${adjuntoParaVer.data}" style="max-width:100%;" ` +
      `onload="window.focus();window.print();" /></body></html>`
    );
    doc.close();
    setTimeout(() => { if (frame.parentNode) frame.parentNode.removeChild(frame); }, 60000);
  };

  const eliminarAdjunto = (idx = adjuntoIdxRef.current) => {
    const adj = (nuevaOrden.adjuntos || [])[idx];
    if (!adj) return;
    if (confirm(`¿Eliminar el archivo "${adj.nombre}"?`)) {
      setNuevaOrden({ ...nuevaOrden, adjuntos: (nuevaOrden.adjuntos || []).filter((_, i) => i !== idx) });
      setMostrarMenuAdjunto(false);
    }
  };

  const handleRutChange = (e) => {
    let val = upperInput(e, /[^0-9K-]/g);
    if (val.length > 12) val = val.slice(0, 12);
    const partes = val.split("-");
    if (partes.length === 2) {
      if (partes[1].length > 1) partes[1] = partes[1][0];
      if (partes[0].length > 0) partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    } else if (partes.length === 1 && partes[0].length > 0) {
      partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    }
    val = partes.join("-");
    setNuevaOrden({ ...nuevaOrden, rut: val });
    if (rutError && val.length >= 9 && validarRUT(val)) setRutError("");
  };

  const handleRutBlur = (e) => {
    const val = e.target.value;
    if (!val) { setRutError(""); return; }
    const limpio = val.replace(/\./g, "").toUpperCase();
    const tieneGuion = limpio.includes("-");
    const match = limpio.match(/^(\d+)-([K0-9])$/);
    if (match) { if (validarRUT(val)) setRutError(""); else setRutError("RUT inválido"); return; }
    if (tieneGuion && !match) setRutError("RUT inválido");
    else if (!tieneGuion && limpio.length >= 5) setRutError("Falta el guion y dígito verificador");
    else setRutError("");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setBusquedaContacto("");
    setMostrarDropdownContacto(false);
  }, [clienteSeleccionado?.id, clienteSeleccionado?.razon_social]);

  // Contacto: catálogo global (mantenedor de Contactos), independiente del
  // cliente — se busca y se copia, igual que Equipo (ver OrdenFormEquipo.jsx).
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

  const normTxt = (s) => String(s || "").toUpperCase().trim();

  // Buscador de "Otros Contactos": mismo catálogo global, consulta propia.
  const [contactosExtraSugeridos, setContactosExtraSugeridos] = useState([]);
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

  // Da de alta en el mantenedor de Contactos el contacto tipeado a mano acá
  // que todavía no existe ahí. Mismo patrón que "+ Registrar en Equipos".
  // Si el backend responde "ya existe" (nombre repetido), en vez de mostrar
  // el error se busca ese contacto y se enlaza igual, para no dejar la fila
  // sin poder editarse cuando el contacto ya estaba en el catálogo.
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

  const registrarContactoEnContactos = async () => {
    if (!String(nuevaOrden.contacto || "").trim()) return;
    const resultado = await registrarOEnlazarContacto(nuevaOrden.contacto, nuevaOrden.emailContacto, nuevaOrden.fonoContacto, nuevaOrden.cargoContacto);
    if (!resultado) return;
    alert(resultado.yaExistia
      ? `El contacto "${nuevaOrden.contacto}" ya estaba en el mantenedor — se enlazó.`
      : `Contacto "${nuevaOrden.contacto}" registrado en el mantenedor.`);
    setNuevaOrden((prev) => ({ ...prev, contactoId: resultado.id }));
  };

  // Al elegir otro contacto como principal, el principal anterior baja a
  // "Otros Contactos" de la OT (en vez de perderse), y si el elegido ya
  // estaba ahí, se saca de esa lista para no quedar duplicado.
  const seleccionarContactoBusqueda = (c) => {
    const nombreNuevo = normTxt(c.nombre);
    const principalActual = {
      nombre: nuevaOrden.contacto, email: nuevaOrden.emailContacto,
      fono: nuevaOrden.fonoContacto, cargo: nuevaOrden.cargoContacto,
      contactoId: nuevaOrden.contactoId
    };
    let extras = nuevaOrden.contactosExtra.filter((x) => normTxt(x.nombre) !== nombreNuevo);
    if (normTxt(principalActual.nombre) && normTxt(principalActual.nombre) !== nombreNuevo) {
      extras = [...extras, {
        nombre: principalActual.nombre, email: principalActual.email,
        fono: principalActual.fono, cargo: principalActual.cargo,
        contactoId: principalActual.contactoId || null
      }];
    }
    setNuevaOrden({
      ...nuevaOrden,
      contacto: c.nombre,
      emailContacto: c.email || "",
      fonoContacto: c.fono || "",
      cargoContacto: c.cargo || "",
      contactoId: c.id,
      contactosExtra: extras
    });
    setBusquedaContacto("");
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
        setNuevaOrden((prev) => ({
          ...prev,
          contacto: toUpper(actualizado.nombre),
          emailContacto: actualizado.email || "",
          fonoContacto: actualizado.fono || "",
          cargoContacto: toUpper(actualizado.cargo || "")
        }));
      } else if (typeof contactoEditTarget === 'number') {
        setNuevaOrden((prev) => {
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
    setNuevaOrden((prev) => ({
      ...prev,
      contactoDireccion: toUpper(d.direccion || ""),
      contactoCiudad: toUpper(d.ciudad || ""),
      contactoComuna: toUpper(d.comuna || ""),
      direccionId: d.id
    }));
    setBusquedaDireccion("");
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
    const resultado = await registrarOEnlazarDireccion(nuevaOrden.contactoDireccion, nuevaOrden.contactoCiudad, nuevaOrden.contactoComuna);
    if (!resultado) return;
    alert(resultado.yaExistia
      ? `La dirección ya estaba en el mantenedor — se enlazó.`
      : `Dirección registrada en el mantenedor.`);
    setNuevaOrden((prev) => ({ ...prev, direccionId: resultado.id }));
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
        setNuevaOrden((prev) => ({
          ...prev,
          contactoDireccion: toUpper(actualizada.direccion || ""),
          contactoCiudad: toUpper(actualizada.ciudad || ""),
          contactoComuna: toUpper(actualizada.comuna || "")
        }));
      } else if (direccionEditTarget === 'cliente') {
        setNuevaOrden((prev) => ({
          ...prev,
          direccion: toUpper(actualizada.direccion || ""),
          ciudad: toUpper(actualizada.ciudad || ""),
          comuna: toUpper(actualizada.comuna || "")
        }));
      } else if (typeof direccionEditTarget === 'number') {
        setNuevaOrden((prev) => {
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
  // catálogo global, consulta propia (igual que contactosExtraSugeridos).
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
    setNuevaOrden((prev) => {
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
    setBusquedaDireccionExtra("");
    setMostrarDropdownDireccionExtra(false);
  };

  // Da de alta en el mantenedor de Direcciones la dirección tipeada a mano
  // en una fila de "Otros Contactos". Mismo patrón que registrarDireccionContacto.
  const registrarDireccionExtra = async (contacto, idx) => {
    const resultado = await registrarOEnlazarDireccion(contacto.direccion, contacto.ciudad, contacto.comuna);
    if (!resultado) return;
    alert(resultado.yaExistia
      ? `La dirección ya estaba en el mantenedor — se enlazó.`
      : `Dirección registrada en el mantenedor.`);
    setNuevaOrden((prev) => {
      const arr = [...prev.contactosExtra];
      arr[idx] = { ...arr[idx], direccionId: resultado.id };
      return { ...prev, contactosExtra: arr };
    });
  };

  // Buscador de Dirección del Cliente (la "primera dirección" de la OT):
  // mismo catálogo global, ya no se ingresa a mano en el mantenedor de
  // Cliente — se busca y se llama, igual que Contacto.
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
    setNuevaOrden((prev) => ({
      ...prev,
      direccion: toUpper(d.direccion || ""),
      ciudad: toUpper(d.ciudad || ""),
      comuna: toUpper(d.comuna || ""),
      clienteDireccionId: d.id
    }));
    setBusquedaDireccionCliente("");
    setMostrarDropdownDireccionCliente(false);
  };

  const registrarDireccionCliente = async () => {
    const resultado = await registrarOEnlazarDireccion(nuevaOrden.direccion, nuevaOrden.ciudad, nuevaOrden.comuna);
    if (!resultado) return;
    alert(resultado.yaExistia
      ? `La dirección ya estaba en el mantenedor — se enlazó.`
      : `Dirección registrada en el mantenedor.`);
    setNuevaOrden((prev) => ({ ...prev, clienteDireccionId: resultado.id }));
  };

  const abrirEditarCliente = async () => {
    let fresh = clienteSeleccionado;
    try {
      const res = await api.get(`/api/clientes/${clienteSeleccionado.id}`);
      if (res.data) fresh = res.data;
    } catch { /* fallback: datos locales */ }
    setClienteAEditar(fresh);
    setMostrarEditarClienteModal(true);
  };

  const guardarEdicionCliente = async (payload, _resetFn, mantener = false) => {
    if (!clienteAEditar?.id) return;
    try {
      await api.put(`/api/clientes/${clienteAEditar.id}`, payload);
      const lista = await api.get("/api/clientes");
      if (onClientesRefresh) onClientesRefresh(lista.data);
      const freshRes = await api.get(`/api/clientes/${clienteAEditar.id}`);
      const fresh = freshRes.data;
      if (setClienteSeleccionado) setClienteSeleccionado(fresh);

      // Sincroniza en la OT solo los datos propios del cliente (Contacto y
      // Dirección ya no viven en Cliente, se buscan aparte en sus catálogos).
      setNuevaOrden((prev) => ({
        ...prev,
        cliente: toUpper(fresh.razon_social || ""),
        rut: fresh.rut || "",
        email: fresh.email || "",
        fonoPrincipal: fresh.telefono || ""
      }));

      alert("Cliente actualizado");
      if (mantener) setClienteAEditar(fresh);
      else setMostrarEditarClienteModal(false);
    } catch (err) {
      alert(err.response?.data?.msg || "Error al actualizar el cliente");
    }
  };

  const abrirRegistrarCliente = () => {
    // Con el comodín "19" se permite crear aunque el RUT o la razón social ya existan
    if (normalizarRut(nuevaOrden.rut) === "19") {
      setPrefillCliente({
        razon_social: nuevaOrden.cliente || "",
        rut: nuevaOrden.rut || "",
        direccion: nuevaOrden.direccion || "",
        ciudad: nuevaOrden.ciudad || "",
        comuna: nuevaOrden.comuna || "",
        telefono: nuevaOrden.fonoPrincipal || "",
        email: nuevaOrden.email || ""
      });
      setMostrarRegistrarCliente(true);
      return;
    }
    // Si el RUT o la razón social ya existen en el mantenedor → solo avisar con el código
    const rutOT = normalizarRut(nuevaOrden.rut);
    const existente =
      (rutOT && (clientes || []).find((c) => normalizarRut(c.rut) === rutOT)) ||
      (clientes || []).find((c) => normTxt(c.razon_social) === normTxt(nuevaOrden.cliente)) ||
      null;
    if (existente) {
      alert(`El cliente ya existe (${existente.codigo || "CL-????"}).`);
      setNuevaOrden((prev) => ({ ...prev, rut: "" }));
      return;
    }
    setPrefillCliente({
      razon_social: nuevaOrden.cliente || "",
      rut: nuevaOrden.rut || "",
      telefono: nuevaOrden.fonoPrincipal || "",
      email: nuevaOrden.email || ""
    });
    setMostrarRegistrarCliente(true);
  };

  const guardarNuevoClienteDesdeOT = async (payload) => {
    try {
      // Con el comodín "19" se crea directo sin chequear duplicados
      // Si ya existe un cliente con ese RUT o razón social → avisar con su código y vincularlo sin crear duplicado
      const esComodin = normalizarRut(payload.rut) === "19";
      const existente = esComodin ? null :
        ((payload.rut && normalizarRut(payload.rut) && (clientes || []).find((c) => normalizarRut(c.rut) === normalizarRut(payload.rut))) ||
        (clientes || []).find((c) => normTxt(c.razon_social) === normTxt(payload.razon_social)) ||
        null);
      if (existente) {
        alert(`El cliente ya existe (${existente.codigo || "CL-????"}).`);
        return;
      }
      const res = await api.post("/api/clientes", payload);
      const lista = await api.get("/api/clientes");
      if (onClientesRefresh) onClientesRefresh(lista.data);
      let fresh = null;
      if (res.data?.id) {
        const freshRes = await api.get(`/api/clientes/${res.data.id}`);
        fresh = freshRes.data;
      } else {
        fresh = (lista.data || []).find((c) => normTxt(c.razon_social) === normTxt(payload.razon_social)) || null;
      }
      if (fresh && setClienteSeleccionado) setClienteSeleccionado(fresh);
      if (fresh) {
        setNuevaOrden((prev) => ({
          ...prev,
          cliente: toUpper(fresh.razon_social || "") || prev.cliente,
          rut: fresh.rut || prev.rut,
          email: fresh.email || prev.email,
          fonoPrincipal: fresh.telefono || prev.fonoPrincipal
        }));
        setBusquedaCliente("");
      }
      alert(`Cliente registrado (${res.data?.codigo || "CL-????"}). Ya puede guardar la orden.`);
      setMostrarRegistrarCliente(false);
      setPrefillCliente(null);
    } catch (err) {
      alert(err.response?.data?.msg || "Error al registrar el cliente");
    }
  };

  return (
    <>
    <div className="of-sec primary" style={{ display: ['cliente', 'contacto', 'otros-contactos'].includes(seccionActiva) ? undefined : 'none' }}>
      <div style={{ display: seccionActiva === 'cliente' ? undefined : 'none' }}>
      <div style={{ marginBottom: '8px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
          {clienteFijo && clienteSeleccionado ? (
            <>
              <Users size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Cliente Asignado
            </>
          ) : (
            <>
              <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Buscar y Seleccionar Cliente
            </>
          )}
        </label>

        {clienteFijo && clienteSeleccionado ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              background: '#E0F2FE',
              border: '1.5px solid var(--primary)',
              borderRadius: 'var(--radius-sm)',
              flexWrap: 'wrap'
            }}>
              <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                {clienteSeleccionado.codigo || 'CL-XXXX'}
              </span>
              <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.85rem' }}>
                {clienteSeleccionado.razon_social}
              </span>
              {clienteInactivo && (
                <span style={{ background: '#F97316', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                  ⚠ Cliente desactivado
                </span>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div ref={clienteDropdownRef} style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="ot-search"
              placeholder="Escriba para buscar cliente por nombre o RUT..."
              value={busquedaCliente}
              onChange={(e) => {
                // Si lo escrito parece RUT (puro número/K/guion/puntos) agrega los puntos;
                // si es texto (razón social o código CL/EQ) deja pasar normal
                const crudo = e.target.value;
                const val = /^[0-9][0-9Kk.-]*$/.test(crudo)
                  ? formatearRutInput(crudo)
                  : upperInput(e);
                setBusquedaCliente(val);
                setMostrarDropdownClientes(val.length >= 2);
              }}
              onFocus={() => {
                if (busquedaCliente.length >= 2) setMostrarDropdownClientes(true);
              }}
              disabled={readOnly}
              style={{
                width: '100%',
                padding: '2px 8px',
                border: '1.5px solid var(--border)',
                borderRadius: '6px',
                fontSize: '.82rem',
                lineHeight: '1.3',
                boxSizing: 'border-box',
                background: clienteSeleccionado ? '#E0F2FE' : 'white',
                color: '#0D9488',
                fontWeight: 600
              }}
            />
            {clienteInactivo && (
              <span style={{
                position: 'absolute',
                right: '40px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#F97316',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem'
              }}>
                ⚠ Cliente desactivado
              </span>
            )}
            <ChevronDown
              size={20}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />

            {mostrarDropdownClientes && busquedaCliente.length >= 2 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1.5px solid var(--border)',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                maxHeight: '250px',
                overflow: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => seleccionarCliente(cliente)}
                      style={{
                        padding: '2px 8px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                          {cliente.codigo || 'CL-XXXX'}
                        </span>
                        <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                          {cliente.razon_social}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        RUT: {cliente.rut || 'N/A'}
                        {cliente.telefono ? ` | Tel: ${cliente.telefono}` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No se encontraron clientes con "{busquedaCliente}"
                  </div>
                )}
              </div>
            )}
          </div>
          {!readOnly && clienteSeleccionado && (
            <button
              type="button"
              onClick={abrirEditarCliente}
              title="Editar todos los datos de este cliente"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                background: 'var(--warning)', color: 'white', border: 'none',
                padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
              }}
            >
              <Pencil size={12} /> Editar
            </button>
          )}
          {!readOnly && !clienteSeleccionado && ((nuevaOrden.cliente || "").trim() || (nuevaOrden.rut || "").trim()) && (
            <button
              type="button"
              onClick={abrirRegistrarCliente}
              title="Registrar este cliente en el mantenedor de Clientes"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                background: 'var(--success)', color: 'white', border: 'none',
                padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
              }}
            >
              <UserPlus size={12} /> Registrar
            </button>
          )}
          </div>
          )}
        </div>

      {/* Modal Editar Cliente completo desde la OT (portal fuera del form) */}
      {mostrarEditarClienteModal && clienteAEditar && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
        >
          <div style={{ maxHeight: '90vh', overflow: 'auto', width: '100%', maxWidth: '900px' }}>
            <ClienteFormulario
              clienteEditando={clienteAEditar}
              clientes={clientes}
              onSave={guardarEdicionCliente}
              onCancel={() => setMostrarEditarClienteModal(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Registrar Cliente desde la OT (portal fuera del form) */}
      {mostrarRegistrarCliente && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
        >
          <div style={{ maxHeight: '90vh', overflow: 'auto', width: '100%', maxWidth: '900px' }}>
            <ClienteFormulario
              clienteEditando={prefillCliente}
              clientes={clientes}
              titulo="Registrar Cliente"
              modoRegistro
              onSave={guardarNuevoClienteDesdeOT}
              onCancel={() => { setMostrarRegistrarCliente(false); setPrefillCliente(null); }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Editar Contacto (mantenedor de Contactos) desde la OT */}
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

      {/* Modal Editar Dirección (mantenedor de Direcciones) desde la OT */}
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

      <div className="of-form-grid" style={{ gridTemplateColumns: '1fr 2fr', marginBottom: '15px' }}>
        <div className="of-f" style={{ position: 'relative' }}>
          <label>RUT {rutError && <span style={{ position: 'absolute', right: 0, top: 0, whiteSpace: 'nowrap', color: '#dc2626', fontSize: '.7rem', textTransform: 'none', letterSpacing: 'normal' }}>{rutError}</span>}</label>
          <input
            type="text"
            placeholder="Ej: 12.345.678-9"
            value={nuevaOrden.rut}
            onChange={handleRutChange}
            onBlur={handleRutBlur}
            disabled={readOnly}
            style={{
              width: '100%',
              border: rutError ? '1px solid #f87171' : undefined,
              background: rutError ? '#fef2f2' : undefined
            }}
          />
        </div>

        <div className="of-f">
          <label>Cliente *</label>
          <input
            type="text"
            placeholder="Nombre del cliente"
            value={nuevaOrden.cliente}
            onChange={(e) => setNuevaOrden({...nuevaOrden, cliente: upperInput(e)})}
            disabled={readOnly}
            required
            style={{
              width: '100%',
              padding: '2px 8px',
              border: '1.5px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>
      </div>

      <div className="of-form-grid" style={{ marginTop: '14px', gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))' }}>
        <div className="of-f">
          <label>Fono Principal</label>
          <input
            type="tel"
            placeholder="Teléfono principal del cliente"
            value={nuevaOrden.fonoPrincipal}
            onChange={(e) => setNuevaOrden({...nuevaOrden, fonoPrincipal: e.target.value.replace(/[^0-9+]/g, '')})}
            disabled={readOnly}
            style={{
              width: '100%',
              padding: '2px 8px',
              border: '1.5px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>

        <div className="of-f">
          <label>Email</label>
          <input
            type="email"
            placeholder="Email del cliente"
            value={nuevaOrden.email}
            onChange={(e) => setNuevaOrden({...nuevaOrden, email: e.target.value})}
            disabled={readOnly}
            style={{
              width: '100%',
              padding: '2px 8px',
              border: '1.5px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>
      </div>

      <div ref={direccionClienteDropdownRef} className="of-f" style={{ marginTop: 14, marginBottom: 4, position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)', fontSize: '1rem', textTransform: 'none', letterSpacing: 'normal' }}>
          <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
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
            disabled={readOnly}
            style={{
              flex: '1 1 200px', minWidth: '120px',
              padding: '2px 8px', border: '1.5px solid var(--border)', borderRadius: '6px',
              fontSize: '.82rem', lineHeight: '1.3', boxSizing: 'border-box',
              background: '#E0F2FE',
              color: '#0D9488', fontWeight: 600
            }}
          />
          {!readOnly && String(nuevaOrden.direccion || "").trim() && (
            nuevaOrden.clienteDireccionId ? (
              <button
                type="button"
                onClick={() => abrirEditarDireccion('cliente', nuevaOrden.clienteDireccionId)}
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
                  <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.82rem' }}>{d.direccion}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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

      <div className="of-form-grid" style={{ gridTemplateColumns: '1.4fr 1fr 1fr', marginBottom: '15px' }}>
        <div className="of-f">
          <label>Dirección</label>
          <input
            type="text"
            placeholder="Dirección del cliente"
            value={nuevaOrden.direccion}
            onChange={(e) => setNuevaOrden({...nuevaOrden, direccion: upperInput(e), clienteDireccionId: null})}
            disabled={readOnly}
            style={{ width: '100%' }}
          />
        </div>

        <div className="of-f">
          <label>Ciudad</label>
          <input
            type="text"
            placeholder="Ciudad"
            value={nuevaOrden.ciudad}
            onChange={(e) => setNuevaOrden({...nuevaOrden, ciudad: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''), clienteDireccionId: null})}
            disabled={readOnly}
            style={{ width: '100%' }}
          />
        </div>

        <div className="of-f">
          <label>Comuna</label>
          <input
            type="text"
            placeholder="Comuna"
            value={nuevaOrden.comuna}
            onChange={(e) => setNuevaOrden({...nuevaOrden, comuna: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''), clienteDireccionId: null})}
            disabled={readOnly}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      </div>

      <div style={{ display: seccionActiva === 'contacto' ? undefined : 'none' }}>
      <div ref={contactoDropdownRef} className="of-f" style={{ marginBottom: 4, position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)', fontSize: '1rem', textTransform: 'none', letterSpacing: 'normal' }}>
          <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
          Buscar Contacto
        </label>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="ot-search"
            placeholder="Escriba para buscar un contacto..."
            value={busquedaContacto}
            onChange={(e) => {
              setBusquedaContacto(e.target.value);
              setMostrarDropdownContacto(e.target.value.trim().length >= 2);
            }}
            onFocus={() => { if (busquedaContacto.trim().length >= 2) setMostrarDropdownContacto(true); }}
            disabled={readOnly}
            style={{
              flex: '1 1 200px', minWidth: '120px',
              padding: '2px 8px',
              border: '1.5px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem',
              lineHeight: '1.3',
              boxSizing: 'border-box',
              background: nuevaOrden.contactoId ? '#E0F2FE' : 'white',
              color: '#0D9488',
              fontWeight: 600
            }}
          />
          {!readOnly && String(nuevaOrden.contacto || "").trim() && (
            nuevaOrden.contactoId ? (
              <button
                type="button"
                onClick={() => abrirEditarContacto('principal', nuevaOrden.contactoId)}
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
                onClick={registrarContactoEnContactos}
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

        {mostrarDropdownContacto && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'white', border: '1px solid var(--border)', borderTop: 'none',
            borderRadius: '0 0 8px 8px', maxHeight: '200px', overflow: 'auto',
            zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            {contactosSugeridos.length > 0 ? (
              contactosSugeridos.map((c) => (
                <div key={c.id}
                  onClick={() => seleccionarContactoBusqueda(c)}
                  style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                >
                  <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.82rem' }}>
                    {c.nombre}
                  </div>
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

      <div className="of-form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="of-f">
          <label>Contacto</label>
          <input
            type="text"
            placeholder="Nombre del contacto"
            value={nuevaOrden.contacto}
            onChange={(e) => setNuevaOrden({...nuevaOrden, contacto: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''), contactoId: null})}
            disabled={readOnly}
            style={{
              width: '100%',
              padding: '2px 8px',
              border: '1.5px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>

        <div className="of-f">
          <label>Fono Contacto</label>
          <input
            type="tel"
            placeholder="Teléfono del contacto"
            value={nuevaOrden.fonoContacto}
            onChange={(e) => setNuevaOrden({...nuevaOrden, fonoContacto: e.target.value.replace(/[^0-9+]/g, '')})}
            disabled={readOnly}
            style={{
              width: '100%',
              padding: '2px 8px',
              border: '1.5px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>
      </div>

      <div className="of-form-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: '10px' }}>
        <div className="of-f">
          <label>Email Contacto</label>
          <input
            type="email"
            placeholder="Email del contacto"
            value={nuevaOrden.emailContacto}
            onChange={(e) => setNuevaOrden({...nuevaOrden, emailContacto: e.target.value})}
            disabled={readOnly}
            style={{
              width: '100%',
              padding: '2px 8px',
              border: '1.5px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>

        <div className="of-f">
          <label>Cargo Contacto</label>
          <input
            type="text"
            placeholder="Cargo del contacto"
            value={nuevaOrden.cargoContacto}
            onChange={(e) => setNuevaOrden({...nuevaOrden, cargoContacto: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '')})}
            disabled={readOnly}
            style={{
              width: '100%',
              padding: '2px 8px',
              border: '1.5px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>
      </div>

      <div ref={direccionBusqDropdownRef} className="of-f" style={{ marginTop: 4, marginBottom: '8px', position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)', fontSize: '1rem', textTransform: 'none', letterSpacing: 'normal' }}>
          <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
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
            disabled={readOnly}
            style={{
              flex: '1 1 200px', minWidth: '120px',
              padding: '2px 8px', border: '1.5px solid var(--border)', borderRadius: '6px',
              fontSize: '.82rem', lineHeight: '1.3', boxSizing: 'border-box',
              background: '#E0F2FE',
              color: '#0D9488', fontWeight: 600
            }}
          />
          {!readOnly && String(nuevaOrden.contactoDireccion || "").trim() && (
            nuevaOrden.direccionId ? (
              <button
                type="button"
                onClick={() => abrirEditarDireccion('principal', nuevaOrden.direccionId)}
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
                  <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.82rem' }}>{d.direccion}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
          <div style={{ height: '6px' }} />
          <label>Dirección</label>
          <input
            type="text"
            placeholder="Dirección"
            value={nuevaOrden.contactoDireccion || ""}
            onChange={(e) => setNuevaOrden({ ...nuevaOrden, contactoDireccion: upperInput(e), direccionId: null })}
            disabled={readOnly}
            style={{ width: '100%', padding: '2px 8px', border: '1.5px solid var(--border)', borderRadius: '6px', fontSize: '.82rem' }}
          />
        </div>

        <div className="of-f">
          <div style={{ height: '6px' }} />
          <label>Ciudad</label>
          <input
            type="text"
            placeholder="Ciudad"
            value={nuevaOrden.contactoCiudad || ""}
            onChange={(e) => setNuevaOrden({ ...nuevaOrden, contactoCiudad: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''), direccionId: null })}
            disabled={readOnly}
            style={{ width: '100%', padding: '2px 8px', border: '1.5px solid var(--border)', borderRadius: '6px', fontSize: '.82rem' }}
          />
        </div>

        <div className="of-f">
          <div style={{ height: '6px' }} />
          <label>Comuna</label>
          <input
            type="text"
            placeholder="Comuna"
            value={nuevaOrden.contactoComuna || ""}
            onChange={(e) => setNuevaOrden({ ...nuevaOrden, contactoComuna: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''), direccionId: null })}
            disabled={readOnly}
            style={{ width: '100%', padding: '2px 8px', border: '1.5px solid var(--border)', borderRadius: '6px', fontSize: '.82rem' }}
          />
        </div>
      </div>
      </div>

      {/* Contactos Extra (dinámicos) */}
      <div style={{ marginTop: '10px', padding: '4px 10px', background: '#F0FDF4', border: '1px solid #7AD6EC', borderRadius: '8px', lineHeight: '1.2', width: '100%', boxSizing: 'border-box', display: seccionActiva === 'otros-contactos' ? undefined : 'none' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem', width: 'fit-content', maxWidth: '100%' }}>
          {mostrarContactosExtra ? <ChevronUp size={14} style={{ color: 'var(--success)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />}
          <input
            type="checkbox"
            className="of-check of-check--contactos"
            checked={mostrarContactosExtra}
            disabled={readOnly && nuevaOrden.contactosExtra.length === 0}
            onChange={(e) => {
              setMostrarContactosExtra(e.target.checked);
              if (!e.target.checked) setContactosResumenAbierto(false);
            }}
          />
          <UserPlus size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
          Otros Contactos
          {nuevaOrden.contactosExtra.length > 0 && (
            <span style={{
              background: 'var(--success)', color: 'white', padding: '1px 8px', borderRadius: '10px',
              fontSize: '0.75rem', fontWeight: '700'
            }}>
              {nuevaOrden.contactosExtra.length}
            </span>
          )}
        </label>

        {mostrarContactosExtra && (
          <div style={{ marginTop: '10px' }}>
            {(() => {
              const actualizarContacto = (idx, campo, valor) => {
                const arr = [...nuevaOrden.contactosExtra];
                arr[idx] = { ...arr[idx], [campo]: valor };
                if (campo === 'nombre') arr[idx].contactoId = null;
                setNuevaOrden({ ...nuevaOrden, contactosExtra: arr });
              };

              // Agrega un contacto existente del catálogo global como nueva fila.
              const agregarContactoDesdeBusqueda = (c) => {
                // Si la fila activa quedó sin contacto (p. ej. tras "Quitar",
                // que conserva la dirección pero limpia el resto), se reusa esa
                // misma fila en vez de crear una nueva — así no queda una fila
                // con dirección y sin contacto, y otra con el contacto recién
                // elegido separadas.
                const filaVaciaActiva = activeIdx != null && !String(activeContacto?.nombre || "").trim()
                  ? activeIdx
                  : null;
                const idx = filaVaciaActiva != null ? filaVaciaActiva : nuevaOrden.contactosExtra.length;
                setNuevaOrden((prev) => {
                  const arr = [...prev.contactosExtra];
                  arr[idx] = {
                    ...(arr[idx] || {}),
                    nombre: c.nombre, email: c.email || "", fono: c.fono || "", cargo: c.cargo || "",
                    contactoId: c.id
                  };
                  return { ...prev, contactosExtra: arr };
                });
                setContactosManualVisibles(new Set([idx]));
                setBusquedaContactoExtra("");
                setMostrarDropdownContactoExtra(false);
                // Fila nueva sin dirección todavía: no debe heredar el texto que
                // haya quedado en el buscador de dirección de otra fila.
                setBusquedaDireccionExtra("");
                setMostrarDropdownDireccionExtra(false);
              };

              // Compartida por el botón "Quitar" de cada fila y por el chip de
              // eliminación rápida (sin tener que abrir el resumen). Si la fila
              // tiene una dirección registrada, se conserva (solo se limpian los
              // datos del contacto); si no tiene dirección, se quita la fila entera.
              const eliminarContacto = (idx) => {
                const actual = nuevaOrden.contactosExtra[idx];
                if (actual && String(actual.direccion || "").trim()) {
                  const arr = [...nuevaOrden.contactosExtra];
                  arr[idx] = { ...arr[idx], nombre: '', email: '', fono: '', cargo: '', contactoId: null };
                  setNuevaOrden({ ...nuevaOrden, contactosExtra: arr });
                  return;
                }
                const arr = nuevaOrden.contactosExtra.filter((_, i) => i !== idx);
                setNuevaOrden({ ...nuevaOrden, contactosExtra: arr });
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
              // de la orden o en otra fila de Otros Contactos.
              const nombreContactoDuplicado = (idx, valor) => {
                const v = normTxt(valor);
                if (!v) return false;
                if (normTxt(nuevaOrden.contacto) === v) return true;
                if (nuevaOrden.contactosExtra.some((c, i) => i !== idx && normTxt(c.nombre) === v)) return true;
                return false;
              };

              // Da de alta en el mantenedor de Contactos un contacto tipeado a mano
              // en "Otros Contactos" que todavía no existe ahí. Mismo patrón que
              // "+ Registrar en Equipos".
              const registrarContactoExtraEnContactos = async (contacto, idx) => {
                const resultado = await registrarOEnlazarContacto(contacto.nombre, contacto.email, contacto.fono, contacto.cargo);
                if (!resultado) return;
                alert(resultado.yaExistia
                  ? `El contacto "${contacto.nombre}" ya estaba en el mantenedor — se enlazó.`
                  : `Contacto "${contacto.nombre}" registrado en el mantenedor.`);
                setNuevaOrden((prev) => {
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

              const activeIdx = contactosManualVisibles.size === 1 ? [...contactosManualVisibles][0] : null;
              const activeContacto = activeIdx != null ? nuevaOrden.contactosExtra[activeIdx] : null;

              // Mientras hay una fila activa/expandida, esa fila ya tiene su
              // propio "Buscar Contacto" (con o sin contacto asignado) — este
              // buscador de arriba es solo para agregar una fila nueva desde
              // cero, así que se oculta para no duplicar el mismo buscador.
              return (
                <>
                  {!readOnly && !activeContacto && (
                    <div ref={contactoExtraDropdownRef} className="of-f" style={{ position: 'relative', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Buscar un contacto existente para agregarlo..."
                          value={busquedaContactoExtra}
                          onChange={(e) => {
                            setBusquedaContactoExtra(e.target.value);
                            setMostrarDropdownContactoExtra(e.target.value.trim().length >= 2);
                          }}
                          onFocus={() => { if (busquedaContactoExtra.trim().length >= 2) setMostrarDropdownContactoExtra(true); }}
                          style={{
                            flex: '1 1 200px', minWidth: '120px', padding: '2px 8px', border: '1.5px solid var(--border)', borderRadius: '6px',
                            fontSize: '.82rem', lineHeight: '1.3', boxSizing: 'border-box',
                            background: 'white', color: '#0D9488', fontWeight: 600
                          }}
                        />
                      </div>
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

                  {nuevaOrden.contactosExtra.length > 0 && !contactosResumenAbierto && (
                    <button
                      type="button"
                      onClick={() => setContactosResumenAbierto(true)}
                      style={{
                        background: 'none', color: 'var(--success)', border: '1px solid #7AD6EC',
                        borderRadius: '6px', padding: '2px 10px', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.75rem', marginRight: '8px'
                      }}
                    >
                      {nuevaOrden.contactosExtra.length} contacto{nuevaOrden.contactosExtra.length > 1 ? 's' : ''} agregado{nuevaOrden.contactosExtra.length > 1 ? 's' : ''} — Ver
                    </button>
                  )}

                  {nuevaOrden.contactosExtra.length > 0 && contactosResumenAbierto && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {nuevaOrden.contactosExtra.map((_, idx) => {
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
                            onClick={() => {
                              setContactosManualVisibles(prev => (
                                // Exclusivo: pinchar un contacto muestra solo ese (no se
                                // van acumulando hacia abajo). Pinchar el mismo lo cierra.
                                prev.has(idx) && prev.size === 1 ? new Set() : new Set([idx])
                              ));
                              // El buscador de dirección es un solo input compartido por
                              // todas las filas: al cambiar de fila se limpia (no debe
                              // mostrar la dirección ya elegida, queda listo para buscar
                              // una nueva sin arrastrar texto de otra fila).
                              setBusquedaDireccionExtra("");
                              setMostrarDropdownDireccionExtra(false);
                            }}
                            title="Editar contacto"
                            style={{ cursor: 'pointer' }}
                          >
                            {/* +2: el contacto principal (fuera de esta lista) ya es "Contacto 1" */}
                            {`Contacto ${idx + 2}`}
                          </span>
                          {!readOnly && (
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

                  {nuevaOrden.contactosExtra.map((c, idx) => {
                    if (!contactosManualVisibles.has(idx)) return null;
                    return (
                    <div key={idx} style={{ marginBottom: '6px', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px' }}>
                      {!readOnly && (
                        <div ref={contactoExtraDropdownRef} className="of-f" style={{ position: 'relative' }}>
                          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)', fontSize: '1rem', textTransform: 'none', letterSpacing: 'normal' }}>
                            <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
                            Buscar Contacto
                          </label>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              className="ot-search"
                              placeholder="Escriba para buscar un contacto..."
                              value={busquedaContactoExtra}
                              onChange={(e) => {
                                setBusquedaContactoExtra(e.target.value);
                                setMostrarDropdownContactoExtra(e.target.value.trim().length >= 2);
                              }}
                              onFocus={() => { if (busquedaContactoExtra.trim().length >= 2) setMostrarDropdownContactoExtra(true); }}
                              style={{
                                flex: '1 1 200px', minWidth: '120px', padding: '2px 8px', border: '1.5px solid var(--border)', borderRadius: '6px',
                                fontSize: '.82rem', lineHeight: '1.3', boxSizing: 'border-box',
                                background: '#E0F2FE', color: '#0D9488', fontWeight: 600
                              }}
                            />
                            {c.nombre.trim() && (
                              c.contactoId ? (
                                <button
                                  type="button"
                                  onClick={() => abrirEditarContacto(idx, c.contactoId)}
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
                                  onClick={() => registrarContactoExtraEnContactos(c, idx)}
                                  title="Registrar este contacto en el mantenedor de Contactos si no existe"
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                                    background: 'var(--success)', color: 'white', border: 'none',
                                    padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                                    fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
                                  }}
                                >
                                  <UserPlus size={12} /> Registrar
                                </button>
                              )
                            )}
                            {c.nombre.trim() && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!confirm("¿Seguro que desea eliminar este contacto?")) return;
                                  eliminarContacto(idx);
                                }}
                                title="Quitar contacto"
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                                  background: '#DC2626', color: 'white', border: 'none',
                                  padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                                  fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
                                }}
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                          {mostrarDropdownContactoExtra && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, right: 0,
                              background: 'white', border: '1px solid var(--border)', borderTop: 'none',
                              borderRadius: '0 0 8px 8px', maxHeight: '200px', overflow: 'auto',
                              zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}>
                              {contactosExtraSugeridos.length > 0 ? (
                                contactosExtraSugeridos.map((cs) => (
                                  <div key={cs.id}
                                    onClick={() => agregarContactoDesdeBusqueda(cs)}
                                    style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                                  >
                                    <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.82rem' }}>{cs.nombre}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      {cs.email ? `✉ ${cs.email}` : ''}{cs.fono ? ` | Tel: ${cs.fono}` : ''}{cs.cargo ? ` | ${cs.cargo}` : ''}
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
                      <div className="of-form-grid" style={{ gap: '8px', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
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
                                alert(`El contacto "${e.target.value.trim()}" ya existe en esta orden.`);
                                const arr = [...nuevaOrden.contactosExtra];
                                arr[idx] = { ...arr[idx], nombre: '', email: '' };
                                setNuevaOrden({ ...nuevaOrden, contactosExtra: arr });
                              }
                            }}
                            disabled={readOnly}
                            style={{ width: '66%' }}
                          />
                        </div>
                        <div className="of-f">
                          <label>Email</label>
                          <input type="email" placeholder="Email" value={c.email} onChange={(e) => actualizarContacto(idx, 'email', e.target.value)} disabled={readOnly} style={{ width: '66%' }} />
                        </div>
                        <div className="of-f">
                          <label>Fono</label>
                          <input type="tel" placeholder="Fono" value={c.fono} onChange={(e) => actualizarContacto(idx, 'fono', e.target.value.replace(/[^0-9+]/g, ''))} disabled={readOnly} style={{ width: '66%' }} />
                        </div>
                        <div className="of-f">
                          <label>Cargo</label>
                          <input type="text" placeholder="Cargo" value={c.cargo} onChange={(e) => actualizarContacto(idx, 'cargo', upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))} disabled={readOnly} style={{ width: '66%' }} />
                        </div>
                      </div>

                      <div ref={direccionExtraDropdownRef} className="of-f" style={{ marginTop: 6, position: 'relative' }}>
                        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)', fontSize: '1rem', textTransform: 'none', letterSpacing: 'normal' }}>
                          <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
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
                            disabled={readOnly}
                            style={{
                              flex: '1 1 200px', minWidth: '120px',
                              padding: '2px 8px', border: '1.5px solid var(--border)', borderRadius: '6px',
                              fontSize: '.82rem', lineHeight: '1.3', boxSizing: 'border-box',
                              background: '#E0F2FE',
                              color: '#0D9488', fontWeight: 600
                            }}
                          />
                          {!readOnly && String(c.direccion || "").trim() && (
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
                          {!readOnly && String(c.direccion || "").trim() && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!confirm("¿Quitar la dirección de este contacto?")) return;
                                setNuevaOrden(prev => {
                                  const arr = [...prev.contactosExtra];
                                  arr[idx] = { ...arr[idx], direccion: '', ciudad: '', comuna: '', direccionId: null };
                                  return { ...prev, contactosExtra: arr };
                                });
                              }}
                              title="Quitar la dirección de este contacto"
                              style={{
                                display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                                background: '#DC2626', color: 'white', border: 'none',
                                padding: '2px 8px', borderRadius: '6px', cursor: 'pointer',
                                fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap'
                              }}
                            >
                              Quitar
                            </button>
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
                                  <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.82rem' }}>{d.direccion}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
                          <input
                            type="text"
                            placeholder="Dirección"
                            value={c.direccion || ""}
                            onChange={(e) => actualizarContacto(idx, 'direccion', upperInput(e))}
                            disabled={readOnly}
                          />
                        </div>
                        <div className="of-f">
                          <label>Ciudad</label>
                          <input
                            type="text"
                            placeholder="Ciudad"
                            value={c.ciudad || ""}
                            onChange={(e) => actualizarContacto(idx, 'ciudad', upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))}
                            disabled={readOnly}
                          />
                        </div>
                        <div className="of-f">
                          <label>Comuna</label>
                          <input
                            type="text"
                            placeholder="Comuna"
                            value={c.comuna || ""}
                            onChange={(e) => actualizarContacto(idx, 'comuna', upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))}
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                    </div>
                    );
                  })}

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        const nuevoIdx = nuevaOrden.contactosExtra.length;
                        setNuevaOrden({
                          ...nuevaOrden,
                          contactosExtra: [...nuevaOrden.contactosExtra, { nombre: "", email: "", fono: "", cargo: "" }]
                        });
                        setContactosManualVisibles(new Set([nuevoIdx]));
                        setBusquedaDireccionExtra("");
                        setMostrarDropdownDireccionExtra(false);
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

      <div style={{ marginTop: '10px', padding: '4px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', lineHeight: '1.2', display: seccionActiva === 'adjuntos' ? undefined : 'none' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem', width: 'fit-content', maxWidth: '100%' }}>
          <button
            type="button"
            onClick={() => setMostrarAdjunto(!mostrarAdjunto)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit' }}
          >
            {mostrarAdjunto ? <ChevronUp size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
            <Paperclip size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            Adjunto
            {(nuevaOrden.adjuntos || []).length > 0 && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} title="Tiene adjunto" />
            )}
          </button>
        </label>

        {mostrarAdjunto && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(nuevaOrden.adjuntos || []).map((adj, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px' }}>
              {adj.tipo === "application/pdf" ? (
                <div style={{ width: '44px', height: '44px', borderRadius: '6px', border: '1px solid var(--border)', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={22} style={{ color: '#DC2626' }} />
                </div>
              ) : (
                adj.tipo.startsWith("image/") && (
                  <img
                    src={adj.data}
                    alt={adj.nombre}
                    style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)', flexShrink: 0 }}
                  />
                )
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {adj.nombre || "Archivo adjunto"}
                </div>
                <div style={{ fontSize: '.68rem', color: 'var(--muted)' }}>{idx === 0 ? "Adjunto 1" : "Adjunto 2"}</div>
              </div>
              <div className="acciones-menu" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="acciones-menu-btn"
                  onClick={(e) => abrirMenuAdjunto(e, idx)}
                  aria-label={`Opciones de ${adj.nombre}`}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))}

          {mostrarMenuAdjunto && (
            <div className="acciones-dropdown" ref={adjuntoDropdownRef} style={{ position: 'fixed', top: posAdjunto.top, left: posAdjunto.left, zIndex: 9999 }}>
              <button className="acciones-item ver" type="button" onClick={() => verAdjunto()}>
                <Eye size={14} /> Ver
              </button>
              {!readOnly && (
                <>
                  <button className="acciones-item edit" type="button" onClick={() => descargarAdjunto()}>
                    <Download size={14} /> Descargar
                  </button>
                  <button className="acciones-item delete" type="button" onClick={() => eliminarAdjunto()}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                </>
              )}
            </div>
          )}

          {(nuevaOrden.adjuntos || []).length < 2 && (
            <div className="of-f">
              <label
                className="ot-search"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: readOnly ? 'not-allowed' : 'pointer', color: 'var(--muted)', minHeight: '26px', margin: 0 }}
              >
                <Paperclip size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {readOnly ? "Sin archivo" : "Seleccionar archivo"}
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleAdjuntoChange}
                  disabled={readOnly}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}
        </div>
        )}
      </div>

      <div style={{ marginTop: '10px', padding: '4px 10px', background: '#FEF9E7', border: '1px solid #F5D48C', borderRadius: '8px', lineHeight: '1.2', display: seccionActiva === 'adjuntos' ? undefined : 'none' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem', width: 'fit-content', maxWidth: '100%' }}>
          <button
            type="button"
            onClick={() => setMostrarInfoInterna(!mostrarInfoInterna)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit' }}
          >
            {mostrarInfoInterna ? <ChevronUp size={14} style={{ color: '#B45309', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: '#B45309', flexShrink: 0 }} />}
            Información Interna
            {String(nuevaOrden.infoInterna || "").trim() && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B45309', flexShrink: 0 }} title="Tiene información interna" />
            )}
          </button>
        </label>

        {mostrarInfoInterna && (
          <div style={{ marginTop: '8px' }}>
            <div className="of-f">
              <textarea
                rows={4}
                placeholder="Notas internas de la orden (no visibles para el cliente)..."
                value={nuevaOrden.infoInterna || ""}
                onChange={(e) => setNuevaOrden({...nuevaOrden, infoInterna: upperInput(e)})}
                disabled={readOnly}
                style={{ width: '100%', padding: '2px 8px', border: '1.5px solid var(--border)', borderRadius: '6px', fontSize: '.82rem', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
          </div>
        )}
      </div>

      {adjuntoParaVer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '12px', width: '90vw', maxWidth: '1000px', height: '88vh', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <span style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adjuntoParaVer.nombre}</span>
              <button type="button" onClick={() => setAdjuntoParaVer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)', lineHeight: 1 }} aria-label="Cerrar">×</button>
            </div>
            {adjuntoParaVer.tipo === "application/pdf" ? (
              <iframe
                src={adjuntoParaVer.data}
                title={adjuntoParaVer.nombre}
                style={{ width: '100%', height: '100%', flex: 1, border: 'none', borderRadius: '6px', background: '#fff' }}
              />
            ) : (
              <img src={adjuntoParaVer.data} alt={adjuntoParaVer.nombre} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '6px' }} />
            )}
            {adjuntoParaVer.tipo !== "application/pdf" && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button type="button" onClick={imprimirAdjunto} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: 'none', borderRadius: '6px', background: '#0D9488', color: '#fff', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
                  <Printer size={14} /> Imprimir
                </button>
                <button type="button" onClick={() => descargarAdjunto()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: 'none', borderRadius: '6px', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
                  <Download size={14} /> Descargar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default OrdenFormCliente;
