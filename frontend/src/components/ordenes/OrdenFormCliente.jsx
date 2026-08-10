import { useState, useRef, useEffect } from "react";
import { Search, Users, ChevronDown, Eye, UserPlus, MapPin } from "lucide-react";
import ClienteFormulario from "../clientes/ClienteFormulario";
import "../../styles/Clientes.css";

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
  readOnly = false
}) {
  const [mostrarDetalleCliente, setMostrarDetalleCliente] = useState(false);
  const [mostrarDireccionesExtra, setMostrarDireccionesExtra] = useState(false);
  const [mostrarContactosExtra, setMostrarContactosExtra] = useState(false);
  const [busquedaContacto, setBusquedaContacto] = useState("");
  const [mostrarDropdownContacto, setMostrarDropdownContacto] = useState(false);
  const contactoDropdownRef = useRef(null);

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
    const extras = String(clienteSeleccionado.contactos || "")
      .split(";;")
      .map((c) => {
        const p = c.split("|");
        return { nombre: (p[0] || "").toUpperCase().trim(), email: p[1] || "", fono: p[2] || "", cargo: p[3] || "" };
      })
      .filter((c) => c.nombre);
    const principal = clienteSeleccionado.contacto_nombre
      ? [{
          nombre: String(clienteSeleccionado.contacto_nombre).toUpperCase().trim(),
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

  return (
    <div className="of-sec success">
      <div className="of-st success">Datos del Cliente</div>

      <div style={{ marginBottom: '12px' }}>
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
              gap: '10px',
              padding: '8px 12px',
              background: '#E0F2FE',
              border: '2px solid var(--primary)',
              borderRadius: '6px',
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
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  height: '32px'
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
                setBusquedaCliente(e.target.value.toUpperCase());
                setMostrarDropdownClientes(e.target.value.length >= 2);
              }}
              onFocus={() => {
                if (busquedaCliente.length >= 2) setMostrarDropdownClientes(true);
              }}
              disabled={readOnly}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #9AB8D9',
                borderRadius: '6px',
                fontSize: '.82rem',
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
                border: '2px solid var(--border)',
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
                        padding: '6px 10px',
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
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                height: '32px'
              }}
            >
                <Eye size={14} /> Ver
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

      <div className="of-form-grid">
        <div className="of-f">
          <label>Cliente *</label>
          <input
            type="text"
            placeholder="Nombre del cliente"
            value={nuevaOrden.cliente}
            onChange={(e) => setNuevaOrden({...nuevaOrden, cliente: e.target.value.toUpperCase()})}
            disabled={readOnly}
            required
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>

        <div className="of-f">
          <label>Dirección</label>
          <input
            type="text"
            placeholder="Dirección del cliente"
            value={nuevaOrden.direccion}
            onChange={(e) => setNuevaOrden({...nuevaOrden, direccion: e.target.value.toUpperCase()})}
            disabled={readOnly}
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>

        <div className="of-f">
          <label>Comuna</label>
          <input
            type="text"
            placeholder="Comuna"
            value={nuevaOrden.comuna}
            onChange={(e) => setNuevaOrden({...nuevaOrden, comuna: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '')})}
            disabled={readOnly}
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>
      </div>

      {/* Direcciones Extra / Sucursales (dinámicas) */}
      <div style={{ marginTop: '10px', padding: '4px 10px', background: '#E0F2FE', border: '1px solid #7CD0F0', borderRadius: '8px', lineHeight: '1.2' }}>
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
                        tipo_direccion: (p[0] || "").toUpperCase().trim(),
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
                    direccion: dir.direccion,
                    comuna: dir.comuna,
                    fono: dir.fono || "",
                    tipo: dir.tipo_direccion || ""
                  }]
                });
              };

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
                        disabled={readOnly}
                        defaultValue=""
                        onChange={(e) => {
                          const i = parseInt(e.target.value, 10);
                          if (isNaN(i) || !direccionesCliente[i]) return;
                          agregarDireccion(direccionesCliente[i]);
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '2px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '.82rem',
                          background: 'white'
                        }}
                      >
                        <option value="">-- Elegir dirección --</option>
                        {direccionesCliente.map((d, idx) => (
                          <option key={idx} value={idx}>
                            {d.tipo_direccion ? `${d.tipo_direccion} | ` : ''}{d.direccion}{d.comuna ? ` | ${d.comuna}` : ''}{d.fono ? ` | F:${d.fono}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {nuevaOrden.direccionesExtra.map((dir, idx) => (
                    <div key={idx} style={{ marginBottom: '8px', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' }}>
                      <div className="of-form-grid">
                        <div className="of-f">
                          <label>Dirección {idx + 1}</label>
                          <input
                            type="text"
                            placeholder="Dirección de la sucursal"
                            value={dir.direccion}
                            onChange={(e) => actualizarDireccion(idx, 'direccion', e.target.value.toUpperCase())}
                            disabled={readOnly}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '2px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '.82rem'
                            }}
                          />
                        </div>

                        <div className="of-f">
                          <label>Comuna</label>
                          <input
                            type="text"
                            placeholder="Comuna de la sucursal"
                            value={dir.comuna}
                            onChange={(e) => actualizarDireccion(idx, 'comuna', e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))}
                            disabled={readOnly}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '2px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '.82rem'
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <input
                          type="tel"
                          placeholder="Fono (opcional)"
                          value={dir.fono}
                          onChange={(e) => actualizarDireccion(idx, 'fono', e.target.value.replace(/[^0-9+]/g, ''))}
                          disabled={readOnly}
                          style={{
                            width: '30%',
                            padding: '6px 10px',
                            border: '2px solid var(--border)',
                            borderRadius: '6px',
                            fontSize: '.82rem'
                          }}
                        />
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!confirm("¿Seguro que desea eliminar esta dirección?")) return;
                              const arr = nuevaOrden.direccionesExtra.filter((_, i) => i !== idx);
                              setNuevaOrden({ ...nuevaOrden, direccionesExtra: arr });
                            }}
                            style={{
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              borderRadius: '6px',
                              padding: '4px 12px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.8rem'
                            }}
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setNuevaOrden({
                          ...nuevaOrden,
                          direccionesExtra: [...nuevaOrden.direccionesExtra, { direccion: "", comuna: "", fono: "", tipo: "" }]
                        });
                      }}
                      style={{
                        marginTop: '6px',
                        background: '#E0F2FE',
                        color: '#0284C7',
                        border: '1px solid #7CD0F0',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.8rem'
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
        <div ref={contactoDropdownRef} style={{ position: 'relative', marginTop: '2px', maxWidth: '268px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)', fontSize: '0.8rem' }}>
            <Search size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Buscar Contacto (por nombre o correo)
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
              padding: '6px 10px',
              border: '1px solid #9AB8D9',
              borderRadius: '6px',
              fontSize: '.82rem',
              background: 'white'
            }}
          />

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
                    style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
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
      )}

      <div className="of-form-grid" style={{ marginTop: '14px' }}>
        <div className="of-f">
          <label>Email</label>
          <input
            type="email"
            placeholder="Email del cliente"
            value={nuevaOrden.email}
            onChange={(e) => setNuevaOrden({...nuevaOrden, email: e.target.value.toUpperCase()})}
            disabled={readOnly}
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--border)',
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
              padding: '6px 10px',
              border: '2px solid var(--border)',
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
            onChange={(e) => setNuevaOrden({...nuevaOrden, contacto: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '')})}
            disabled={readOnly}
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--border)',
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
            onChange={(e) => setNuevaOrden({...nuevaOrden, emailContacto: e.target.value.toUpperCase()})}
            disabled={readOnly}
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--border)',
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
              padding: '6px 10px',
              border: '2px solid var(--border)',
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
            onChange={(e) => setNuevaOrden({...nuevaOrden, tecnicoAsignado: e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '')})}
            disabled={readOnly}
            required
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--border)',
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
                      return { nombre: (p[0] || "").toUpperCase().trim(), email: p[1] || "", fono: p[2] || "", cargo: p[3] || "" };
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
                    cargo: c.cargo
                  }]
                });
              };

              const actualizarContacto = (idx, campo, valor) => {
                const arr = [...nuevaOrden.contactosExtra];
                arr[idx] = { ...arr[idx], [campo]: valor };
                setNuevaOrden({ ...nuevaOrden, contactosExtra: arr });
              };

              return (
                <>
                  {contactosCliente.length >= 1 && (
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)', fontSize: '0.8rem' }}>
                        Agregar contacto del cliente
                      </label>
                      <select
                        disabled={readOnly}
                        defaultValue=""
                        onChange={(e) => {
                          const i = parseInt(e.target.value, 10);
                          if (isNaN(i) || !contactosCliente[i]) return;
                          agregarContacto(contactosCliente[i]);
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: '2px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '.82rem',
                          background: 'white'
                        }}
                      >
                        <option value="">-- Elegir contacto --</option>
                        {contactosCliente.map((c, idx) => (
                          <option key={idx} value={idx}>
                            {c.nombre}{c.fono ? ` | ${c.fono}` : ''}{c.email ? ` | ${c.email}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {nuevaOrden.contactosExtra.map((c, idx) => (
                    <div key={idx} style={{ marginBottom: '8px', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px' }}>
                      <div className="of-form-grid">
                        <div className="of-f">
                          <label>Contacto {idx + 1}</label>
                          <input
                            type="text"
                            placeholder="Nombre del contacto"
                            value={c.nombre}
                            onChange={(e) => actualizarContacto(idx, 'nombre', e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))}
                            disabled={readOnly}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '2px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '.82rem'
                            }}
                          />
                        </div>

                        <div className="of-f">
                          <label>Email</label>
                          <input
                            type="email"
                            placeholder="Email del contacto"
                            value={c.email}
                            onChange={(e) => actualizarContacto(idx, 'email', e.target.value.toUpperCase())}
                            disabled={readOnly}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '2px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '.82rem'
                            }}
                          />
                        </div>

                        <div className="of-f">
                          <label>Fono</label>
                          <input
                            type="tel"
                            placeholder="Teléfono del contacto"
                            value={c.fono}
                            onChange={(e) => actualizarContacto(idx, 'fono', e.target.value.replace(/[^0-9+]/g, ''))}
                            disabled={readOnly}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '2px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '.82rem'
                            }}
                          />
                        </div>

                        <div className="of-f">
                          <label>Cargo</label>
                          <input
                            type="text"
                            placeholder="Cargo del contacto"
                            value={c.cargo}
                            onChange={(e) => actualizarContacto(idx, 'cargo', e.target.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑ\s]/g, ''))}
                            disabled={readOnly}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '2px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '.82rem'
                            }}
                          />
                        </div>
                      </div>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!confirm("¿Seguro que desea eliminar este contacto?")) return;
                            const arr = nuevaOrden.contactosExtra.filter((_, i) => i !== idx);
                            setNuevaOrden({ ...nuevaOrden, contactosExtra: arr });
                          }}
                          style={{
                            marginTop: '6px',
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            borderRadius: '6px',
                            padding: '4px 12px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem'
                          }}
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  ))}

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        setNuevaOrden({
                          ...nuevaOrden,
                          contactosExtra: [...nuevaOrden.contactosExtra, { nombre: "", email: "", fono: "", cargo: "" }]
                        });
                      }}
                      style={{
                        marginTop: '6px',
                        background: '#F0FDF4',
                        color: 'var(--success)',
                        border: '1px solid #7AD6EC',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.8rem'
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
  );
}

export default OrdenFormCliente;
