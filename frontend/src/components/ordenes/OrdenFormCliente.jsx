import { useState, useEffect } from "react";
import { Link2 } from "lucide-react";
import CampoCatalogo from "../comunes/CampoCatalogo";
import OrdenAdjuntos from "./OrdenAdjuntos";
import OrdenInfoInterna from "./OrdenInfoInterna";
import OrdenBuscadorCliente from "./OrdenBuscadorCliente";
import OrdenDatosCliente from "./OrdenDatosCliente";
import OrdenDatosContacto from "./OrdenDatosContacto";
import OrdenDatosDireccion from "./OrdenDatosDireccion";
import useClienteOT from "./useClienteOT";
import "../../styles/Clientes.css";
import "../../styles/campo-catalogo.css";
import "../../styles/botones.css";
import { toUpper, normalizarRut } from "../../utils/helpers";
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

      <OrdenBuscadorCliente
        busquedaCliente={busquedaCliente} setBusquedaCliente={setBusquedaCliente}
        mostrarDropdownClientes={mostrarDropdownClientes} setMostrarDropdownClientes={setMostrarDropdownClientes}
        clienteDropdownRef={clienteDropdownRef} clientesFiltrados={clientesFiltrados} seleccionarCliente={seleccionarCliente}
        clienteSeleccionado={clienteSeleccionado} clienteFijo={clienteFijo} clienteInactivo={clienteInactivo} readOnly={readOnly}
        nuevaOrden={nuevaOrden} abrirDetalleCliente={abrirDetalleCliente}
        botonesEditarCliente={botonesEditarCliente} abrirRegistrarCliente={abrirRegistrarCliente}
      />

      {modalesCliente}

      <OrdenDatosCliente
        nuevaOrden={nuevaOrden} setNuevaOrden={setNuevaOrden} readOnly={readOnly} esPersona={esPersona}
        tieneCliente={!!clienteSeleccionado}
        bloqueados={{ cliente: clienteBloqueado, rut: rutBloqueado, fono: fonoBloqueado, email: emailBloqueado }}
      />

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

      <OrdenDatosContacto nuevaOrden={nuevaOrden} setNuevaOrden={setNuevaOrden} deshabilitado={readOnly || esPersona || contactoBloqueado} />

      <OrdenDatosDireccion nuevaOrden={nuevaOrden} setNuevaOrden={setNuevaOrden} deshabilitado={readOnly || direccionBloqueada} />



    </div>

      <OrdenAdjuntos nuevaOrden={nuevaOrden} setNuevaOrden={setNuevaOrden} readOnly={readOnly} />

      <OrdenInfoInterna nuevaOrden={nuevaOrden} setNuevaOrden={setNuevaOrden} readOnly={readOnly} />

    </>
  );
}

export default OrdenFormCliente;
