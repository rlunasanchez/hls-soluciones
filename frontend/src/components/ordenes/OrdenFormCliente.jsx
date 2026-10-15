import { useState, useEffect } from "react";
import { Search, Users, ChevronDown, ChevronUp, Eye, UserPlus, Link2 } from "lucide-react";
import CampoCatalogo from "../comunes/CampoCatalogo";
import OrdenAdjuntos from "./OrdenAdjuntos";
import useClienteOT from "./useClienteOT";
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
  const [rutError, setRutError] = useState("");
  const [mostrarInfoInterna, setMostrarInfoInterna] = useState(false);

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

  // Ver / editar / registrar el cliente desde la OT (modales y sus funciones de guardado)
  const { botonesEditarCliente, abrirRegistrarCliente, abrirDetalleCliente, modalesCliente } = useClienteOT({
    nuevaOrden, setNuevaOrden, clientes, clienteSeleccionado, setClienteSeleccionado,
    onClientesRefresh, setBusquedaCliente, normTxt
  });

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

  // Tras editar un contacto/dirección en el catálogo, las listas del cliente seleccionado quedan
  // viejas y el aviso "ya no está vinculado" salta aunque sea el mismo registro: se recargan.
  const refrescarClienteSeleccionado = async () => {
    if (!clienteSeleccionado?.id) return;
    try {
      const lista = await api.get("/api/clientes");
      if (onClientesRefresh) onClientesRefresh(lista.data);
      const actualizado = lista.data.find((c) => c.id === clienteSeleccionado.id);
      if (actualizado && setClienteSeleccionado) setClienteSeleccionado(actualizado);
    } catch { /* el aviso se corrige al volver a abrir; no es crítico */ }
  };
  const contactoEditadoEnOT = (c) => { contactoEnOT(c); refrescarClienteSeleccionado(); };
  const direccionEditadaEnOT = (d) => { direccionEnOT(d); refrescarClienteSeleccionado(); };

  // Direcciones vinculadas al cliente (llegan como texto: tipo|direccion|fono|ciudad|comuna)
  const direccionesDelCliente = clienteSeleccionado
    ? String(clienteSeleccionado.direcciones || "").split(";;").map((d) => {
        const p = d.split("|");
        return { direccion: (p[1] || "").toUpperCase().trim(), ciudad: (p[3] || "").toUpperCase().trim(), comuna: (p[4] || "").toUpperCase().trim() };
      }).filter((d) => d.direccion)
    : [];

  // ¿El contacto / la dirección de la OT siguen vinculados a la ficha del cliente?
  const esPersona = nuevaOrden.clienteTipo === "PERSONA";
  const contactoDesvinculado = !esPersona && !!clienteSeleccionado && !!normTxt(nuevaOrden.contacto)
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
  // Lo traído del buscador (está en el catálogo o vinculado al cliente) no se escribe a mano: para
  // cambiarlo se usa "Editar" o se busca otro. Lo que no está en ningún lado queda libre.
  const contactoBloqueado = !esPersona && !!normTxt(nuevaOrden.contacto)
    && (contactoRegistrado === true || (!!clienteSeleccionado && !contactoDesvinculado));
  const direccionBloqueada = !!normTxt(nuevaOrden.direccion)
    && (direccionRegistrada === true || (!!clienteSeleccionado && !direccionDesvinculada));
  // Datos propios del cliente: bloqueados mientras coincidan con su ficha (para cambiarlos, "Editar")
  const dig = (v) => String(v || "").replace(/\D/g, "");
  const igual = (a, b) => !!normTxt(b) && normTxt(a) === normTxt(b);
  const cli = clienteSeleccionado;
  const clienteBloqueado = !!cli && igual(nuevaOrden.cliente, cli.razon_social);
  const rutBloqueado = !!cli && !!normalizarRut(cli.rut) && normalizarRut(nuevaOrden.rut) === normalizarRut(cli.rut);
  const fonoBloqueado = !!cli && !!dig(cli.telefono) && dig(nuevaOrden.fonoPrincipal) === dig(cli.telefono);
  const emailBloqueado = !!cli && !!String(cli.email || "").trim()
    && String(nuevaOrden.email || "").trim().toLowerCase() === String(cli.email).trim().toLowerCase();
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
                onClick={abrirDetalleCliente}
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
              onClick={abrirDetalleCliente}
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

      {modalesCliente}

      {/* Datos del cliente */}
      <div className="of-caja">
        <div className="of-caja-titulo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          Datos del cliente
          {/* Con un cliente elegido el tipo viene de su ficha; en una OT desde cero se elige acá. */}
          <select
            value={esPersona ? "PERSONA" : "EMPRESA"}
            disabled={readOnly || !!clienteSeleccionado}
            style={{ padding: '0 6px', fontSize: '.75rem', height: '20px', border: '1.5px solid var(--border)', borderRadius: '6px', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400, color: 'var(--text-secondary, #475569)' }}
            onChange={(e) => {
              const tipo = e.target.value;
              setNuevaOrden((prev) => ({
                ...prev,
                clienteTipo: tipo,
                // Una persona no tiene contacto: se limpian sus campos
                ...(tipo === "PERSONA" ? { contacto: "", fonoContacto: "", emailContacto: "", cargoContacto: "" } : {})
              }));
            }}
          >
            <option value="EMPRESA">Empresa</option>
            <option value="PERSONA">Persona</option>
          </select>
        </div>
        <div className="of-form-grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: '15px' }}>
          <div className="of-f">
            <label>{esPersona ? "Nombre *" : "Cliente *"}</label>
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={nuevaOrden.cliente}
              onChange={(e) => setNuevaOrden({...nuevaOrden, cliente: upperInput(e)})}
              disabled={readOnly || clienteBloqueado}
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
              disabled={readOnly || rutBloqueado}
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
              disabled={readOnly || fonoBloqueado}
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
              disabled={readOnly || emailBloqueado}
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
          {!esPersona && <CampoCatalogo
            key={`contactos-${clienteSeleccionado?.id || "sin-cliente"}`}
            tipo="contactos"
            etiqueta="Buscar Contacto"
            placeholder="Buscar contacto del cliente o de Contactos..."
            readOnly={readOnly}
            deCliente={contactosDisponibles}
            actual={nuevaOrden.contacto}
            datosRegistro={{ nombre: nuevaOrden.contacto, email: nuevaOrden.emailContacto, fono: nuevaOrden.fonoContacto, cargo: nuevaOrden.cargoContacto }}
            onElegir={contactoEnOT}
            onActualizado={contactoEditadoEnOT}
            onEnCatalogo={setContactoRegistrado}
          />}
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
          onActualizado={direccionEditadaEnOT}
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
              disabled={readOnly || esPersona || contactoBloqueado}
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
              disabled={readOnly || esPersona || contactoBloqueado}
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
              disabled={readOnly || esPersona || contactoBloqueado}
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
              disabled={readOnly || esPersona || contactoBloqueado}
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
              disabled={readOnly || direccionBloqueada}
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
              disabled={readOnly || direccionBloqueada}
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
              disabled={readOnly || direccionBloqueada}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>




    </div>

      <OrdenAdjuntos nuevaOrden={nuevaOrden} setNuevaOrden={setNuevaOrden} readOnly={readOnly} />

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

    </>
  );
}

export default OrdenFormCliente;
