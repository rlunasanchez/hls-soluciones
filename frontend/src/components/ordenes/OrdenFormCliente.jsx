import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Users, ChevronDown, ChevronUp, Eye, UserPlus, MapPin, Paperclip, MoreVertical, Download, Trash2, FileText, Printer, Pencil } from "lucide-react";
import ClienteFormulario from "../clientes/ClienteFormulario";
import "../../styles/Clientes.css";
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
  onClientesRefresh
}) {
  const [mostrarDetalleCliente, setMostrarDetalleCliente] = useState(false);
  const [rutError, setRutError] = useState("");
  const [mostrarDireccionesExtra, setMostrarDireccionesExtra] = useState(false);
  const [mostrarContactosExtra, setMostrarContactosExtra] = useState(false);
  const [direccionesExpandidas, setDireccionesExpandidas] = useState(false);
  const [contactosExpandidos, setContactosExpandidos] = useState(false);
  const LIMITE_EXTRAS = 1;
  const [busquedaContacto, setBusquedaContacto] = useState("");
  const [mostrarDropdownContacto, setMostrarDropdownContacto] = useState(false);
  const contactoDropdownRef = useRef(null);
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setBusquedaContacto("");
    setMostrarDropdownContacto(false);
  }, [clienteSeleccionado?.id, clienteSeleccionado?.razon_social]);

  const contactosDisponibles = (() => {
    if (!clienteSeleccionado) return [];
    const principalNombre = String(clienteSeleccionado.contacto_nombre || "").toUpperCase().trim();
    const principalEmail = String(clienteSeleccionado.contacto_email || "").toUpperCase().trim();
    const extras = String(clienteSeleccionado.contactos || "")
      .split(";;")
      .map((c) => {
        const p = c.split("|");
        return { nombre: (p[0] || "").toUpperCase().trim(), email: p[1] || "", fono: p[2] || "", cargo: p[3] || "" };
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
          email: clienteSeleccionado.contacto_email || "",
          fono: clienteSeleccionado.contacto_fono || "",
          cargo: clienteSeleccionado.contacto_cargo || "",
          principal: true
        }]
      : [];
    return [...principal, ...extras];
  })();

  const contactosFiltrados = busquedaContacto.trim().length >= 2
    ? contactosDisponibles.filter((c) => {
        const q = busquedaContacto.toUpperCase();
        return (c.nombre || "").includes(q) || (c.email || "").toUpperCase().includes(q);
      })
    : [];

  const seleccionarContactoBusqueda = (c) => {
    setNuevaOrden({
      ...nuevaOrden,
      contacto: c.nombre,
      emailContacto: c.email || "",
      fonoContacto: c.fono || ""
    });
    setBusquedaContacto(c.nombre);
    setMostrarDropdownContacto(false);
  };

  const normTxt = (s) => String(s || "").toUpperCase().trim();

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

      // Sincronizar en la OT los datos derivados del cliente recién editado
      const principalC = { nombre: normTxt(fresh.contacto_nombre), email: fresh.contacto_email || "", fono: fresh.contacto_fono || "" };
      const extras = String(fresh.contactos || "").split(";;").map((s) => {
        const p = s.split("|");
        return { nombre: (p[0] || "").toUpperCase().trim(), email: p[1] || "", fono: p[2] || "" };
      }).filter((c) => c.nombre && c.nombre !== principalC.nombre);
      const todosContactos = [...(principalC.nombre ? [principalC] : []), ...extras];

      setNuevaOrden((prev) => {
        const base = {
          ...prev,
          cliente: toUpper(fresh.razon_social || ""),
          rut: fresh.rut || "",
          direccion: toUpper(fresh.direccion || ""),
          comuna: toUpper(fresh.comuna || ""),
          email: fresh.email || "",
          fonoPrincipal: fresh.telefono || ""
        };
        // Si el contacto escrito en la OT sigue existiendo, refresca su email/fono
        const contactoOT = normTxt(prev.contacto);
        if (contactoOT) {
          const match = todosContactos.find((c) => c.nombre === contactoOT);
          if (match) {
            base.emailContacto = match.email;
            base.fonoContacto = match.fono;
          }
        }
        return base;
      });

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
        comuna: nuevaOrden.comuna || "",
        telefono: nuevaOrden.fonoPrincipal || "",
        email: nuevaOrden.email || "",
        contacto_nombre: nuevaOrden.contacto || "",
        contacto_email: nuevaOrden.emailContacto || "",
        contacto_fono: nuevaOrden.fonoContacto || ""
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
      direccion: nuevaOrden.direccion || "",
      comuna: nuevaOrden.comuna || "",
      telefono: nuevaOrden.fonoPrincipal || "",
      email: nuevaOrden.email || "",
      contacto_nombre: nuevaOrden.contacto || "",
      contacto_email: nuevaOrden.emailContacto || "",
      contacto_fono: nuevaOrden.fonoContacto || ""
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
          direccion: toUpper(fresh.direccion || "") || prev.direccion,
          comuna: toUpper(fresh.comuna || "") || prev.comuna,
          email: fresh.email || prev.email,
          fonoPrincipal: fresh.telefono || prev.fonoPrincipal,
          contacto: toUpper(fresh.contacto_nombre || "") || prev.contacto,
          emailContacto: fresh.contacto_email || prev.emailContacto,
          fonoContacto: fresh.contacto_fono || prev.fonoContacto
        }));
        setBusquedaCliente(toUpper(fresh.razon_social || ""));
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
    <div className="of-sec primary">
      <div className="of-st success">Datos del Cliente</div>

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
              {clienteInactivo ? (
                <span style={{ background: '#F97316', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                  ⚠ Cliente desactivado
                </span>
              ) : (
                <span style={{ background: 'var(--success)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                  ✓ Seleccionado
                </span>
              )}
            </div>
            {readOnly && (
              <button
                type="button"
                onClick={() => setMostrarDetalleCliente(true)}
                title="Ver todos los datos del cliente"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#0D9488',
                  color: 'white',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  height: '24px'
                }}
              >
                <Eye size={14} /> Ver
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
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
                background: clienteSeleccionado ? '#E0F2FE' : 'white'
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
            {!clienteInactivo && clienteSeleccionado && (
              <span style={{
                position: 'absolute',
                right: '40px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--success)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem'
              }}>
                ✓ Seleccionado
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
                        RUT: {cliente.rut || 'N/A'} | {cliente.direccion || ''}, {cliente.comuna || ''}
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
          {clienteSeleccionado && readOnly && (
            <button
              type="button"
              onClick={() => setMostrarDetalleCliente(true)}
              title="Ver todos los datos del cliente"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#0D9488',
                color: 'white',
                border: 'none',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                height: '24px'
              }}
            >
                <Eye size={14} /> Ver
            </button>
          )}
          {!readOnly && clienteSeleccionado && (
            <button
              type="button"
              onClick={abrirEditarCliente}
              title="Editar todos los datos de este cliente"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'var(--warning)', color: 'white', border: 'none',
                padding: '2px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap',
                flexShrink: 0, height: '24px'
              }}
            >
              <Pencil size={14} /> Editar
            </button>
          )}
          {!readOnly && !clienteSeleccionado && ((nuevaOrden.cliente || "").trim() || (nuevaOrden.rut || "").trim()) && (
            <button
              type="button"
              onClick={abrirRegistrarCliente}
              title="Registrar este cliente en el mantenedor de Clientes"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'var(--success)', color: 'white', border: 'none',
                padding: '2px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap',
                flexShrink: 0, height: '24px'
              }}
            >
              <UserPlus size={14} /> Registrar en Clientes
            </button>
          )}
          </div>
          )}
        </div>

      {/* Modal Detalle Cliente (solo lectura) */}
      {mostrarDetalleCliente && clienteSeleccionado && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setMostrarDetalleCliente(false); }}
        >
          <div style={{ maxHeight: '90vh', overflow: 'auto', width: '100%', maxWidth: '900px' }}>
            <ClienteFormulario
              clienteEditando={clienteSeleccionado}
              clientes={clientes}
              onSave={() => {}}
              onCancel={() => setMostrarDetalleCliente(false)}
              readOnly
            />
          </div>
        </div>
      )}

      {/* Modal Editar Cliente completo desde la OT (portal fuera del form) */}
      {mostrarEditarClienteModal && clienteAEditar && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setMostrarEditarClienteModal(false); }}
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
          onClick={(e) => { if (e.target === e.currentTarget) { setMostrarRegistrarCliente(false); setPrefillCliente(null); } }}
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

      <div className="of-form-grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: '15px' }}>
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
          <label>Dirección</label>
          <input
            type="text"
            placeholder="Dirección del cliente"
            value={nuevaOrden.direccion}
            onChange={(e) => setNuevaOrden({...nuevaOrden, direccion: upperInput(e)})}
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
            onChange={(e) => setNuevaOrden({...nuevaOrden, comuna: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '')})}
            disabled={readOnly}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Direcciones Extra / Sucursales (dinámicas) */}
      <div style={{ marginTop: '34px', padding: '4px 10px', background: '#E0F2FE', border: '1px solid #7CD0F0', borderRadius: '8px', lineHeight: '1.2' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem', width: 'fit-content', maxWidth: '100%' }}>
          <input
            type="checkbox"
            className="of-check of-check--direcciones"
            checked={mostrarDireccionesExtra}
            disabled={readOnly && nuevaOrden.direccionesExtra.length === 0}
            onChange={(e) => setMostrarDireccionesExtra(e.target.checked)}
          />
          <MapPin size={14} style={{ color: '#0284C7', flexShrink: 0 }} />
          Otras Direcciones / Sucursales
          {nuevaOrden.direccionesExtra.length > 0 && (
            <span style={{
              background: '#0284C7', color: 'white', padding: '1px 8px', borderRadius: '10px',
              fontSize: '0.75rem', fontWeight: '700'
            }}>
              {nuevaOrden.direccionesExtra.length}
            </span>
          )}
        </label>

        {mostrarDireccionesExtra && (
          <div style={{ marginTop: '10px' }}>
            {(() => {
                      const direccionesCliente = clienteSeleccionado
                ? String(clienteSeleccionado.direcciones || "").split(";;")
                    .map(d => {
                      const p = d.split("|");
                      return {
                        tipo_direccion: (p[0] || "").trim(),
                        direccion: (p[1] || "").toUpperCase().trim(),
                        fono: p[2] || "",
                        ciudad: (p[3] || "").toUpperCase().trim(),
                        comuna: (p[4] || "").toUpperCase().trim()
                      };
                    })
                    .filter(d => d.direccion)
                : [];

              const agregarDireccion = (dir) => {
                setNuevaOrden({
                  ...nuevaOrden,
                  direccionesExtra: [...nuevaOrden.direccionesExtra, {
                    tipo: dir.tipo_direccion || "",
                    direccion: dir.direccion,
                    ciudad: dir.ciudad || "",
                    fono: dir.fono || "",
                    comuna: dir.comuna
                  }]
                });
              };

              // Direcciones del cliente aún no agregadas (sin duplicados)
              const direccionesYaAgregadas = nuevaOrden.direccionesExtra.map(d => d.direccion.toUpperCase().trim());
              const direccionesDisponibles = direccionesCliente.filter(d => !direccionesYaAgregadas.includes(d.direccion.toUpperCase().trim()));

              const actualizarDireccion = (idx, campo, valor) => {
                const arr = [...nuevaOrden.direccionesExtra];
                arr[idx] = { ...arr[idx], [campo]: valor };
                setNuevaOrden({ ...nuevaOrden, direccionesExtra: arr });
              };

              return (
                <>
                  {direccionesCliente.length >= 1 && (
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)', fontSize: '0.8rem' }}>
                        Agregar dirección del cliente
                      </label>
                      <select
                        disabled={readOnly || direccionesDisponibles.length === 0}
                        defaultValue=""
                        onChange={(e) => {
                          const i = parseInt(e.target.value, 10);
                          if (isNaN(i) || !direccionesDisponibles[i]) return;
                          agregarDireccion(direccionesDisponibles[i]);
                        }}
                        style={{
                          width: '100%',
                          padding: '2px 8px',
                          border: '1.5px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '.82rem',
                          background: 'white'
                        }}
                      >
                        <option value="">-- Elegir dirección --</option>
                        {direccionesDisponibles.map((d, idx) => (
                          <option key={idx} value={idx}>
                            {d.tipo_direccion ? `${d.tipo_direccion} | ` : ''}{d.direccion}{d.ciudad ? ` | ${d.ciudad}` : ''}{d.comuna ? ` | ${d.comuna}` : ''}{d.fono ? ` | F:${d.fono}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {nuevaOrden.direccionesExtra.slice(0, direccionesExpandidas ? nuevaOrden.direccionesExtra.length : LIMITE_EXTRAS).map((dir, idx) => (
                    <div key={idx} style={{ marginBottom: '6px', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', marginBottom: '4px' }}>
                        <div className="of-f" style={{ flex: '0 0 120px' }}>
                          <label>Tipo</label>
                          <select value={dir.tipo} onChange={(e) => actualizarDireccion(idx, 'tipo', e.target.value)} disabled={readOnly}>
                            <option value="">Seleccionar</option>
                            <option value="Matriz">Matriz</option>
                            <option value="Sucursal">Sucursal</option>
                          </select>
                        </div>
                        <div className="of-f" style={{ flex: '1 1 0' }}>
                          <label>Dirección {idx + 1}</label>
                          <input type="text" placeholder="Dirección" value={dir.direccion} onChange={(e) => actualizarDireccion(idx, 'direccion', upperInput(e))} disabled={readOnly} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', marginTop: '4px' }}>
                        <div className="of-f" style={{ flex: '0 0 140px' }}>
                          <label>Ciudad</label>
                          <input type="text" placeholder="Ciudad" value={dir.ciudad} onChange={(e) => actualizarDireccion(idx, 'ciudad', upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))} disabled={readOnly} />
                        </div>
                        <div className="of-f" style={{ flex: '0 0 130px' }}>
                          <label>Fono</label>
                          <input type="tel" placeholder="Fono" value={dir.fono} onChange={(e) => actualizarDireccion(idx, 'fono', e.target.value.replace(/[^0-9+]/g, ''))} disabled={readOnly} />
                        </div>
                        <div className="of-f" style={{ flex: '0 0 140px' }}>
                          <label>Comuna</label>
                          <input type="text" placeholder="Comuna" value={dir.comuna} onChange={(e) => actualizarDireccion(idx, 'comuna', upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))} disabled={readOnly} />
                        </div>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!confirm("¿Seguro que desea eliminar esta dirección?")) return;
                              const arr = nuevaOrden.direccionesExtra.filter((_, i) => i !== idx);
                              setNuevaOrden({ ...nuevaOrden, direccionesExtra: arr });
                            }}
                            style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {nuevaOrden.direccionesExtra.length > LIMITE_EXTRAS && (
                    <div style={{ marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setDireccionesExpandidas(!direccionesExpandidas)}
                        style={{
                          background: 'none',
                          color: '#0284C7',
                          border: '1px solid #7CD0F0',
                          borderRadius: '6px',
                          padding: '2px 10px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        {direccionesExpandidas ? 'Ver menos' : `Ver todas (${nuevaOrden.direccionesExtra.length})`}
                      </button>
                    </div>
                  )}

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setNuevaOrden({
                          ...nuevaOrden,
                          direccionesExtra: [...nuevaOrden.direccionesExtra, { tipo: "", direccion: "", ciudad: "", fono: "", comuna: "" }]
                        });
                      }}
                      style={{
                        marginTop: '6px',
                        background: '#E0F2FE',
                        color: '#0284C7',
                        border: '1px solid #7CD0F0',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      + Agregar dirección
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {clienteSeleccionado && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '14px' }}>
        <div ref={contactoDropdownRef} style={{ position: 'relative' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: 'var(--text)', fontSize: '0.8rem' }}>
            <Search size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Buscar Contacto
          </label>
          <input
            type="text"
            className="ot-search"
            placeholder="Escriba para buscar contacto del cliente..."
            value={busquedaContacto}
            onChange={(e) => {
              setBusquedaContacto(e.target.value);
              setMostrarDropdownContacto(e.target.value.trim().length >= 2);
            }}
            onFocus={() => { if (busquedaContacto.trim().length >= 2) setMostrarDropdownContacto(true); }}
            disabled={readOnly || contactosDisponibles.length === 0}
            style={{
              width: '100%',
              padding: '2px 8px',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '.82rem',
              background: 'white'
            }}
          />

          <div style={{ height: '6px' }} />

          {mostrarDropdownContacto && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'white', border: '1px solid var(--border)', borderTop: 'none',
              borderRadius: '0 0 8px 8px', maxHeight: '200px', overflow: 'auto',
              zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              {contactosFiltrados.length > 0 ? (
                contactosFiltrados.map((c, idx) => (
                  <div key={idx}
                    onClick={() => seleccionarContactoBusqueda(c)}
                    style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.82rem' }}>
                      {c.nombre}
                      {!c.principal && <span style={{ fontWeight: '400', color: 'var(--text-muted)' }}> (adicional)</span>}
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
        </div>
      )}

      <div className="of-form-grid" style={{ marginTop: '14px' }}>
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

        <div className="of-f" style={{ gap: '4px' }}>
          <label style={{ fontSize: '10px' }}>Fono Principal</label>
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

        <div className="of-f" style={{ gap: '4px' }}>
          <label style={{ fontSize: '10px' }}>Contacto</label>
          <input
            type="text"
            placeholder="Nombre del contacto"
            value={nuevaOrden.contacto}
            onChange={(e) => setNuevaOrden({...nuevaOrden, contacto: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '')})}
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

      <div className="of-form-grid">
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

        <div className="of-f">
          <label>Técnico Asignado *</label>
          <input
            type="text"
            placeholder="Nombre y apellido del técnico"
            value={nuevaOrden.tecnicoAsignado}
            onChange={(e) => setNuevaOrden({...nuevaOrden, tecnicoAsignado: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '')})}
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

      {/* Contactos Extra (dinámicos) */}
      <div style={{ marginTop: '10px', padding: '4px 10px', background: '#F0FDF4', border: '1px solid #7AD6EC', borderRadius: '8px', lineHeight: '1.2' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem', width: 'fit-content', maxWidth: '100%' }}>
          <input
            type="checkbox"
            className="of-check of-check--contactos"
            checked={mostrarContactosExtra}
            disabled={readOnly && nuevaOrden.contactosExtra.length === 0}
            onChange={(e) => setMostrarContactosExtra(e.target.checked)}
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
              const contactosCliente = clienteSeleccionado
                ? String(clienteSeleccionado.contactos || "").split(";;")
                    .map(c => {
                      const p = c.split("|");
                      return { nombre: (p[0] || "").toUpperCase().trim(), email: p[1] || "", fono: p[2] || "", cargo: p[3] || "", direccion: (p[4] || "").toUpperCase().trim() };
                    })
                    .filter(c => c.nombre)
                : [];

              const agregarContacto = (c) => {
                setNuevaOrden({
                  ...nuevaOrden,
                  contactosExtra: [...nuevaOrden.contactosExtra, {
                    nombre: c.nombre,
                    email: c.email,
                    fono: c.fono,
                    cargo: c.cargo,
                    direccion: c.direccion || ""
                  }]
                });
              };

              const actualizarContacto = (idx, campo, valor) => {
                const arr = [...nuevaOrden.contactosExtra];
                arr[idx] = { ...arr[idx], [campo]: valor };
                setNuevaOrden({ ...nuevaOrden, contactosExtra: arr });
              };

              // Contactos del cliente aún no agregados (sin duplicados)
              const contactosYaAgregados = nuevaOrden.contactosExtra.map(c => (c.nombre || "").toUpperCase().trim());
              const contactosExtraDisponibles = contactosCliente.filter(c => !contactosYaAgregados.includes(c.nombre.toUpperCase().trim()));

              return (
                <>
                  {contactosCliente.length >= 1 && (
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)', fontSize: '0.8rem' }}>
                        Agregar contacto del cliente
                      </label>
                      <select
                        disabled={readOnly || contactosExtraDisponibles.length === 0}
                        defaultValue=""
                        onChange={(e) => {
                          const i = parseInt(e.target.value, 10);
                          if (isNaN(i) || !contactosExtraDisponibles[i]) return;
                          agregarContacto(contactosExtraDisponibles[i]);
                        }}
                        style={{
                          width: '100%',
                          padding: '2px 8px',
                          border: '1.5px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '.82rem',
                          background: 'white'
                        }}
                      >
                        <option value="">-- Elegir contacto --</option>
                        {contactosExtraDisponibles.map((c, idx) => (
                          <option key={idx} value={idx}>
                            {c.nombre}{c.fono ? ` | ${c.fono}` : ''}{c.email ? ` | ${c.email}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {nuevaOrden.contactosExtra.slice(0, contactosExpandidos ? nuevaOrden.contactosExtra.length : LIMITE_EXTRAS).map((c, idx) => (
                    <div key={idx} style={{ marginBottom: '6px', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px' }}>
                      <div className="of-form-grid" style={{ gap: '8px' }}>
                        <div className="of-f">
                          <label>Contacto {idx + 1}</label>
                          <input type="text" placeholder="Nombre" value={c.nombre} onChange={(e) => actualizarContacto(idx, 'nombre', upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))} disabled={readOnly} />
                        </div>
                        <div className="of-f">
                          <label>Email</label>
                          <input type="email" placeholder="Email" value={c.email} onChange={(e) => actualizarContacto(idx, 'email', e.target.value)} disabled={readOnly} />
                        </div>
                        <div className="of-f">
                          <label>Fono</label>
                          <input type="tel" placeholder="Fono" value={c.fono} onChange={(e) => actualizarContacto(idx, 'fono', e.target.value.replace(/[^0-9+]/g, ''))} disabled={readOnly} />
                        </div>
                        <div className="of-f">
                          <label>Dirección Contacto</label>
                          <input type="text" placeholder="Dirección Contacto" value={c.direccion} onChange={(e) => actualizarContacto(idx, 'direccion', upperInput(e))} disabled={readOnly} />
                        </div>
                        <div className="of-f">
                          <label>Cargo</label>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input type="text" placeholder="Cargo" value={c.cargo} onChange={(e) => actualizarContacto(idx, 'cargo', upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))} disabled={readOnly} style={{ flex: '1 1 auto', width: 'auto' }} />
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!confirm("¿Seguro que desea eliminar este contacto?")) return;
                                  const arr = nuevaOrden.contactosExtra.filter((_, i) => i !== idx);
                                  setNuevaOrden({ ...nuevaOrden, contactosExtra: arr });
                                }}
                                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', lineHeight: '1.3', flexShrink: 0 }}
                              >
                                Quitar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {nuevaOrden.contactosExtra.length > LIMITE_EXTRAS && (
                    <div style={{ marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setContactosExpandidos(!contactosExpandidos)}
                        style={{
                          background: 'none',
                          color: 'var(--success)',
                          border: '1px solid #7AD6EC',
                          borderRadius: '6px',
                          padding: '2px 10px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      >
                        {contactosExpandidos ? 'Ver menos' : `Ver todos (${nuevaOrden.contactosExtra.length})`}
                      </button>
                    </div>
                  )}

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setNuevaOrden({
                          ...nuevaOrden,
                          contactosExtra: [...nuevaOrden.contactosExtra, { nombre: "", email: "", fono: "", direccion: "", cargo: "" }]
                        });
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

      <div style={{ marginTop: '10px', padding: '4px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', lineHeight: '1.2' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem', width: 'fit-content', maxWidth: '100%' }}>
          <button
            type="button"
            onClick={() => setMostrarAdjunto(!mostrarAdjunto)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit' }}
          >
            {mostrarAdjunto ? <ChevronUp size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
            <Paperclip size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            Adjunto
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

      <div style={{ marginTop: '10px', padding: '4px 10px', background: '#FEF9E7', border: '1px solid #F5D48C', borderRadius: '8px', lineHeight: '1.2' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem', width: 'fit-content', maxWidth: '100%' }}>
          <button
            type="button"
            onClick={() => setMostrarInfoInterna(!mostrarInfoInterna)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit' }}
          >
            {mostrarInfoInterna ? <ChevronUp size={14} style={{ color: '#B45309', flexShrink: 0 }} /> : <ChevronDown size={14} style={{ color: '#B45309', flexShrink: 0 }} />}
            Información Interna
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setAdjuntoParaVer(null)}>
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {adjuntoParaVer.tipo !== "application/pdf" && (
                <button type="button" onClick={imprimirAdjunto} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: 'none', borderRadius: '6px', background: '#0D9488', color: '#fff', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
                  <Printer size={14} /> Imprimir
                </button>
              )}
              <button type="button" onClick={() => descargarAdjunto()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: 'none', borderRadius: '6px', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '.78rem', fontWeight: 600 }}>
                <Download size={14} /> Descargar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrdenFormCliente;
