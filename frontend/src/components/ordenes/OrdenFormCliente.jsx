import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Users, ChevronDown, ChevronUp, Eye, UserPlus, Paperclip, MoreVertical, Download, Trash2, FileText, Printer, Pencil, Link2 } from "lucide-react";
import ClienteFormulario from "../clientes/ClienteFormulario";
import CampoCatalogo from "../comunes/CampoCatalogo";
import "../../styles/Clientes.css";
import "../../styles/campo-catalogo.css";
import "../../styles/botones.css";
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
  const [mostrarEditarClienteModal, setMostrarEditarClienteModal] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState(null);
  // true = ficha solo con los datos del cliente; false = ficha completa (con contactos y direcciones)
  const [editarSoloCliente, setEditarSoloCliente] = useState(false);
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

  const contactosDisponibles = (() => {
    if (!clienteSeleccionado) return [];
    const principalNombre = String(clienteSeleccionado.contacto_nombre || "").toUpperCase().trim();
    const extras = String(clienteSeleccionado.contactos || "")
      .split(";;")
      .map((c) => {
        const p = c.split("|");
        return { nombre: (p[0] || "").toUpperCase().trim(), email: p[1] || "", fono: p[2] || "", cargo: p[3] || "" };
      })
      .filter((c) => c.nombre)
      // El principal ya no viene repetido en la lista, pero por si acaso se descarta por NOMBRE.
      // No por correo: contactos distintos pueden compartir el mismo email.
      .filter((c) => !(principalNombre && c.nombre.toUpperCase().trim() === principalNombre));
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

  const normTxt = (s) => String(s || "").toUpperCase().trim();

  // Contacto y dirección de la OT: se eligen (o se corrigen en su ficha) con CampoCatalogo.
  // La OT muestra un contacto y una dirección; si lo elegido estaba entre los "adicionales"
  // de una OT antigua, se saca de ahí.
  const contactoEnOT = (c) => setNuevaOrden((prev) => ({
    ...prev,
    contacto: toUpper(c.nombre), emailContacto: c.email || "", fonoContacto: c.fono || "", cargoContacto: toUpper(c.cargo || ""),
    contactosExtra: (prev.contactosExtra || []).filter((x) => normTxt(x.nombre) !== normTxt(c.nombre))
  }));
  const direccionEnOT = (d) => setNuevaOrden((prev) => ({
    ...prev,
    direccion: toUpper(d.direccion), ciudad: toUpper(d.ciudad || ""), comuna: toUpper(d.comuna || ""),
    direccionesExtra: (prev.direccionesExtra || []).filter((x) => normTxt(x.direccion) !== normTxt(d.direccion))
  }));

  // Direcciones vinculadas al cliente (llegan como texto: tipo|direccion|fono|ciudad|comuna)
  const direccionesDelCliente = clienteSeleccionado
    ? String(clienteSeleccionado.direcciones || "").split(";;").map((d) => {
        const p = d.split("|");
        return { direccion: (p[1] || "").toUpperCase().trim(), ciudad: (p[3] || "").toUpperCase().trim(), comuna: (p[4] || "").toUpperCase().trim() };
      }).filter((d) => d.direccion)
    : [];

  // ¿El contacto / la dirección de la OT siguen vinculados a la ficha del cliente?
  const contactoDesvinculado = !!clienteSeleccionado && !!normTxt(nuevaOrden.contacto)
    && !contactosDisponibles.some((c) => normTxt(c.nombre) === normTxt(nuevaOrden.contacto));
  const direccionDesvinculada = !!clienteSeleccionado && !!normTxt(nuevaOrden.direccion)
    && !direccionesDelCliente.some((d) => normTxt(d.direccion) === normTxt(nuevaOrden.direccion));
  const avisoDesvinculado = {
    display: 'inline-flex', alignItems: 'center', height: '24px', boxSizing: 'border-box',
    background: 'var(--warning-light)', color: '#8A4B00', border: '1px solid color-mix(in srgb, var(--warning) 45%, white)',
    borderRadius: 'var(--radius-sm)', padding: '0 10px', fontSize: '.74rem', fontWeight: 600
  };

  // Al abrir la OT (o al volver a la ventana) se vuelve a leer la ficha del cliente: los
  // contactos y direcciones vinculados pueden haber cambiado desde que se cargó la lista,
  // y de eso depende el aviso "ya no está vinculado".
  useEffect(() => {
    const id = clienteSeleccionado?.id;
    if (!id || readOnly) return undefined;
    let vigente = true;
    const refrescar = async () => {
      try {
        const { data } = await api.get(`/api/clientes/${id}`);
        if (!vigente || !data || !setClienteSeleccionado) return;
        setClienteSeleccionado((prev) => (
          prev && prev.id === id && (prev.contactos !== data.contactos || prev.direcciones !== data.direcciones
            || prev.contacto_nombre !== data.contacto_nombre) ? data : prev
        ));
      } catch { /* se queda con los datos que ya hay */ }
    };
    refrescar();
    window.addEventListener("focus", refrescar);
    return () => { vigente = false; window.removeEventListener("focus", refrescar); };
  }, [clienteSeleccionado?.id, readOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vincula al cliente el contacto / dirección que la OT ya tiene: se reutiliza el del
  // catálogo si existe (por nombre / dirección) o se crea, y se enlaza a la ficha.
  const [vinculando, setVinculando] = useState(false);
  // ¿Lo que tiene la OT ya está en el catálogo? Vincular solo se ofrece después de Registrar.
  const [contactoRegistrado, setContactoRegistrado] = useState(null);
  const [direccionRegistrada, setDireccionRegistrada] = useState(null);
  const vincularAlCliente = async (tipo) => {
    if (!clienteSeleccionado?.id || vinculando) return;
    setVinculando(true);
    try {
      const esContacto = tipo === "contactos";
      const body = esContacto
        ? { nombre: nuevaOrden.contacto, email: nuevaOrden.emailContacto, fono: nuevaOrden.fonoContacto, cargo: nuevaOrden.cargoContacto, reutilizar: true }
        : { direccion: nuevaOrden.direccion, ciudad: nuevaOrden.ciudad, comuna: nuevaOrden.comuna, reutilizar: true };
      const { data } = await api.post(`/api/${tipo}`, body);
      await api.post(`/api/clientes/${clienteSeleccionado.id}/${tipo}`, esContacto ? { contacto_id: data.id } : { direccion_id: data.id });
      const lista = await api.get("/api/clientes");
      if (onClientesRefresh) onClientesRefresh(lista.data);
      const actualizado = lista.data.find((c) => c.id === clienteSeleccionado.id);
      if (actualizado && setClienteSeleccionado) setClienteSeleccionado(actualizado);
    } catch (err) {
      alert(err.response?.data?.msg || "Error al vincular al cliente.");
    } finally {
      setVinculando(false);
    }
  };

  const abrirEditarCliente = async (soloCliente = false) => {
    setEditarSoloCliente(soloCliente);
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
      const freshRes = await api.get(`/api/clientes/${clienteAEditar.id}`);
      const fresh = freshRes.data;

      // Se refrescan los datos propios del cliente. El check "En la OT" solo indica qué
      // contacto/dirección llevar: si al guardar cambió el marcado, la OT toma el nuevo;
      // si no cambió (o no hay ninguno marcado), el contacto y la dirección de la OT no se tocan.
      const cambioContacto = !!fresh.contacto_nombre && normTxt(fresh.contacto_nombre) !== normTxt(clienteAEditar.contacto_nombre);
      const cambioDireccion = !!fresh.ot_direccion && normTxt(fresh.ot_direccion) !== normTxt(clienteAEditar.ot_direccion);
      setNuevaOrden((prev) => ({
        ...prev,
        cliente: toUpper(fresh.razon_social || ""),
        rut: fresh.rut || "",
        email: fresh.email || "",
        fonoPrincipal: fresh.telefono || "",
        ...(cambioContacto ? {
          contacto: toUpper(fresh.contacto_nombre),
          emailContacto: fresh.contacto_email || "",
          fonoContacto: fresh.contacto_fono || "",
          cargoContacto: toUpper(fresh.contacto_cargo || "")
        } : {}),
        ...(cambioDireccion ? {
          direccion: toUpper(fresh.ot_direccion),
          ciudad: toUpper(fresh.ot_ciudad || ""),
          comuna: toUpper(fresh.ot_comuna || "")
        } : {})
      }));

      // El check es de un solo uso: ya se enviaron los datos a la OT, se desmarca
      // (en la edición solo del cliente no se tocan los checks)
      if (!editarSoloCliente) await api.post(`/api/clientes/${clienteAEditar.id}/limpiar-a-ot`);
      const [lista, limpio] = await Promise.all([api.get("/api/clientes"), api.get(`/api/clientes/${clienteAEditar.id}`)]);
      if (onClientesRefresh) onClientesRefresh(lista.data);
      if (setClienteSeleccionado) setClienteSeleccionado(limpio.data);

      alert("Cliente actualizado");
      if (mantener) setClienteAEditar(limpio.data);
      else setMostrarEditarClienteModal(false);
    } catch (err) {
      alert(err.response?.data?.msg || "Error al actualizar el cliente");
    }
  };

  const botonesEditarCliente = (
    <>
      <button type="button" className="btn-mini btn-mini--warning" onClick={() => abrirEditarCliente(false)}
        title="Editar el cliente con sus contactos y direcciones">
        <Pencil size={14} /> Editar completo
      </button>
      <button type="button" className="btn-mini btn-mini--warning" onClick={() => abrirEditarCliente(true)}
        title="Editar solo los datos del cliente (razón social, RUT, fono, email)">
        <Pencil size={14} /> Editar
      </button>
    </>
  );

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
        email: nuevaOrden.email || "",
        contacto_nombre: nuevaOrden.contacto || "",
        contacto_email: nuevaOrden.emailContacto || "",
        contacto_fono: nuevaOrden.fonoContacto || "",
        contacto_cargo: nuevaOrden.cargoContacto || ""
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
      ciudad: nuevaOrden.ciudad || "",
      comuna: nuevaOrden.comuna || "",
      telefono: nuevaOrden.fonoPrincipal || "",
      email: nuevaOrden.email || "",
      contacto_nombre: nuevaOrden.contacto || "",
      contacto_email: nuevaOrden.emailContacto || "",
      contacto_fono: nuevaOrden.fonoContacto || "",
      contacto_cargo: nuevaOrden.cargoContacto || ""
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
          fonoPrincipal: fresh.telefono || prev.fonoPrincipal,
          contacto: toUpper(fresh.contacto_nombre || "") || prev.contacto,
          emailContacto: fresh.contacto_email || prev.emailContacto,
          fonoContacto: fresh.contacto_fono || prev.fonoContacto,
          cargoContacto: toUpper(fresh.contacto_cargo || "") || prev.cargoContacto
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
      <div className="of-st primary">Datos del Cliente</div>

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
              ) : null}
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
            {!readOnly && botonesEditarCliente}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div ref={clienteDropdownRef} style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="ot-search bc-input"
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
          {!readOnly && clienteSeleccionado && botonesEditarCliente}
          {!readOnly && !clienteSeleccionado && ((nuevaOrden.cliente || "").trim() || (nuevaOrden.rut || "").trim()) && (
            <button type="button" className="btn-mini btn-mini--success" onClick={abrirRegistrarCliente}
              title="Registrar este cliente en el mantenedor de Clientes">
              <UserPlus size={14} /> Registrar en Clientes
            </button>
          )}
          </div>
          )}
        </div>

      {/* Modal Detalle Cliente (solo lectura) */}
      {mostrarDetalleCliente && clienteSeleccionado && (
        <div className="bc-modal">
          <div className="bc-modal-caja bc-modal-caja--ancha">
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
        <div className="bc-modal">
          <div className={`bc-modal-caja ${editarSoloCliente ? "bc-modal-caja--chica" : "bc-modal-caja--ancha"}`}>
            <ClienteFormulario
              clienteEditando={clienteAEditar}
              clientes={clientes}
              onSave={guardarEdicionCliente}
              onCancel={() => setMostrarEditarClienteModal(false)}
              soloCliente={editarSoloCliente}
              titulo={editarSoloCliente ? "Editar Cliente" : "Editar Cliente completo"}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Registrar Cliente desde la OT (portal fuera del form) */}
      {mostrarRegistrarCliente && createPortal(
        <div className="bc-modal">
          <div className="bc-modal-caja bc-modal-caja--ancha">
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

      {/* Datos del cliente */}
      <div className="of-caja">
        <div className="of-caja-titulo">Datos del cliente</div>
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
        </div>

        <div className="of-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0 }}>
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
      </div>

      {/* Buscadores: contacto y dirección, uno al lado del otro; ambos con lista para ver y elegir */}
      <div className="of-form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '10px' }}>
          <CampoCatalogo
            key={`contactos-${clienteSeleccionado?.id || "sin-cliente"}`}
            tipo="contactos"
            etiqueta="Buscar Contacto"
            placeholder="Buscar contacto del cliente o de Contactos..."
            readOnly={readOnly}
            deCliente={contactosDisponibles}
            actual={nuevaOrden.contacto}
            datosRegistro={{ nombre: nuevaOrden.contacto, email: nuevaOrden.emailContacto, fono: nuevaOrden.fonoContacto, cargo: nuevaOrden.cargoContacto }}
            onElegir={contactoEnOT}
            onActualizado={contactoEnOT}
            onEnCatalogo={setContactoRegistrado}
          />
        <CampoCatalogo
          key={`direcciones-${clienteSeleccionado?.id || "sin-cliente"}`}
          tipo="direcciones"
          etiqueta="Buscar Dirección"
          placeholder="Buscar dirección del cliente o de Direcciones..."
          deCliente={direccionesDelCliente}
          actual={nuevaOrden.direccion}
          readOnly={readOnly}
          datosRegistro={{ direccion: nuevaOrden.direccion, ciudad: nuevaOrden.ciudad, comuna: nuevaOrden.comuna }}
          onElegir={direccionEnOT}
          onActualizado={direccionEnOT}
          onEnCatalogo={setDireccionRegistrada}
        />
      </div>

      {/* La OT conserva su copia del contacto y la dirección; si ya no están vinculados al
          cliente (se quitaron de su ficha) se avisa, sin borrar nada. */}
      {clienteSeleccionado && (contactoDesvinculado || direccionDesvinculada) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginBottom: '10px' }}>
          {contactoDesvinculado && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={avisoDesvinculado}>
                ⚠ Este contacto ya no está vinculado al cliente
                {!readOnly && contactoRegistrado === false && " (primero Regístralo)"}
              </span>
              {!readOnly && contactoRegistrado === true && (
                <button type="button" className="btn-mini btn-mini--success" disabled={vinculando}
                  onClick={() => vincularAlCliente("contactos")} title="Vincular este contacto a la ficha del cliente">
                  <Link2 size={14} /> Vincular al cliente
                </button>
              )}
            </div>
          )}
          {direccionDesvinculada && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={avisoDesvinculado}>
                ⚠ Esta dirección ya no está vinculada al cliente
                {!readOnly && direccionRegistrada === false && " (primero Regístrala)"}
              </span>
              {!readOnly && direccionRegistrada === true && (
                <button type="button" className="btn-mini btn-mini--success" disabled={vinculando}
                  onClick={() => vincularAlCliente("direcciones")} title="Vincular esta dirección a la ficha del cliente">
                  <Link2 size={14} /> Vincular al cliente
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Datos del contacto */}
      <div className="of-caja">
        <div className="of-caja-titulo">Datos del contacto</div>
        <div className="of-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="of-f">
            <label>Contacto</label>
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
      </div>

      {/* Datos de la dirección */}
      <div className="of-caja">
        <div className="of-caja-titulo">Datos de la dirección</div>
        <div className="of-form-grid" style={{ gridTemplateColumns: '1.4fr 1fr 1fr', marginBottom: 0 }}>
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
            <label>Ciudad</label>
            <input
              type="text"
              placeholder="Ciudad"
              value={nuevaOrden.ciudad}
              onChange={(e) => setNuevaOrden({...nuevaOrden, ciudad: upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '')})}
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

      <div style={{ marginTop: '10px', padding: '4px 10px', background: '#FEF9E7', border: '1px solid #F5D48C', borderRadius: '8px', lineHeight: '1.2' }}>
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
