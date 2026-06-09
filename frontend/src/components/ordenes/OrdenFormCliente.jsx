import { useState } from "react";
import { Search, ChevronDown, Plus, X, Trash2, Save, Users } from "lucide-react";
import api from "../../services/api";
import "../../pages/Clientes.css";

function OrdenFormCliente({
  busquedaCliente, setBusquedaCliente,
  mostrarDropdownClientes, setMostrarDropdownClientes,
  clienteSeleccionado,
  clientesFiltrados,
  clienteDropdownRef,
  seleccionarCliente,
  nuevaOrden, setNuevaOrden,
  clientes = [],
  esEdicion = false
}) {
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    razon_social: "", giro: "", rut: "", direccion: "", ciudad: "",
    comuna: "", telefono: "", email: "", contacto_nombre: "",
    contacto_email: "", contacto_fono: "", contacto_cargo: "", contacto_direccion: ""
  });
  const [sucursales, setSucursales] = useState([
    { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
    { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
    { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
    { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
    { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" }
  ]);
  const [sucursalesVisibles, setSucursalesVisibles] = useState(1);
  const [rutError, setRutError] = useState("");

  const validarRUT = (rut) => {
    if (!rut) return false;
    const limpio = rut.replace(/\./g, "").toUpperCase();
    const match = limpio.match(/^(\d+)-([K0-9])$/);
    if (!match) return false;
    const num = parseInt(match[1], 10);
    if (num < 100000) return false;
    const dv = match[2];
    let suma = 0, mul = 2;
    const digits = String(num).split("").reverse().join("");
    for (let i = 0; i < digits.length; i++) {
      suma += parseInt(digits[i], 10) * mul;
      mul = mul === 7 ? 2 : mul + 1;
    }
    const res = 11 - (suma % 11);
    const esperado = res === 11 ? "0" : res === 10 ? "K" : String(res);
    return dv === esperado;
  };

  const resetModal = () => {
    setNuevoCliente({
      razon_social: "", giro: "", rut: "", direccion: "", ciudad: "",
      comuna: "", telefono: "", email: "", contacto_nombre: "",
      contacto_email: "", contacto_fono: "", contacto_cargo: "", contacto_direccion: ""
    });
    setSucursales([
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" }
    ]);
    setSucursalesVisibles(1);
    setRutError("");
  };

  const guardarNuevoCliente = async (e) => {
    e.preventDefault();
    if (nuevoCliente.rut && !validarRUT(nuevoCliente.rut)) {
      alert("RUT inválido. Ejemplo: 12.345.678-9");
      return;
    }
    setCreandoCliente(true);
    try {
      const dirs = sucursales.filter((s) => s.direccion.trim() !== "");
      await api.post("/api/clientes", { ...nuevoCliente, direcciones: dirs });
      const res = await api.get("/api/clientes");
      const clientesActualizados = res.data;
      const nuevo = clientesActualizados.find(c => c.razon_social === nuevoCliente.razon_social && c.rut === nuevoCliente.rut);
      if (nuevo) {
        seleccionarCliente(nuevo);
      }
      setMostrarModalCliente(false);
      resetModal();
    } catch (err) {
      alert(err.response?.data?.msg || "Error al crear cliente");
    } finally {
      setCreandoCliente(false);
    }
  };

  const actualizarSucursal = (idx, campo, valor) => {
    const nuevas = [...sucursales];
    nuevas[idx][campo] = valor;
    setSucursales(nuevas);
  };

  return (
    <div className="of-sec success">
      <div className="of-st success">Datos del Cliente</div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
          <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
          Buscar y Seleccionar Cliente
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <div ref={clienteDropdownRef} style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Escriba para buscar cliente por nombre o RUT..."
              value={busquedaCliente}
              onChange={(e) => {
                setBusquedaCliente(e.target.value);
                setMostrarDropdownClientes(e.target.value.length >= 2);
              }}
              onFocus={() => {
                if (busquedaCliente.length >= 2) setMostrarDropdownClientes(true);
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '2px solid var(--primary)',
                borderRadius: '6px',
                fontSize: '.82rem',
                background: clienteSeleccionado ? '#E0F2FE' : 'white'
              }}
            />
            {clienteSeleccionado && (
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
          {!esEdicion && (
            <button
              type="button"
              onClick={() => { resetModal(); setMostrarModalCliente(true); }}
              title="Crear nuevo cliente"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--primary)',
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
              <Plus size={14} /> Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Modal Nuevo Cliente -- mismo diseño que Clientes.jsx */}
      {mostrarModalCliente && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) { setMostrarModalCliente(false); resetModal(); } }}
        >
          <div className="cf-wrap" style={{ maxHeight: '90vh', overflow: 'auto' }}>
            <div className="cf-card">
              <div className="cf-head">
                <h2><Users size={24} />Nuevo Cliente</h2>
                <button onClick={() => { setMostrarModalCliente(false); resetModal(); }}><X size={20} /></button>
              </div>
              <form onSubmit={guardarNuevoCliente} className="cf">
                <div className="cf-grid">
                  <div className="cf-sec cf-sec-empresa">
                    <h3>Datos de la Empresa</h3>
                    <div className="cf-codigo" style={{ marginBottom: 6 }}>
                      <div className="cf-field">
                        <label>Código</label>
                        <input value={(() => {
                          let max = 0;
                          (clientes || []).forEach((c) => {
                            if (c.codigo && c.codigo.startsWith("CL-")) {
                              const num = parseInt(c.codigo.split("-")[1], 10);
                              if (num > max) max = num;
                            }
                          });
                          return `CL-${String(max + 1).padStart(4, "0")}`;
                        })()} disabled />
                      </div>
                    </div>
                    <div className="cf-r2" style={{ gap: 6 }}>
                      <div className="cf-field">
                        <label>Razón Social *</label>
                        <input placeholder="Razón social" value={nuevoCliente.razon_social}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value })} required />
                      </div>
                      <div className="cf-field">
                        <label>Giro</label>
                        <input placeholder="Giro" value={nuevoCliente.giro}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, giro: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })} />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "200px", gap: 6, marginTop: 6 }}>
                      <div className="cf-field">
                        <label>RUT {rutError && <span style={{ color: "#dc2626", fontSize: ".72rem" }}> — {rutError}</span>}</label>
                        <input placeholder="Ej: 12.345.678-9" value={nuevoCliente.rut}
                          style={rutError ? { border: "2px solid #dc2626", background: "#fef2f2" } : {}}
                          onChange={(e) => {
                            let val = e.target.value.toUpperCase().replace(/[^0-9K-]/g, "");
                            if (val.length > 12) val = val.slice(0, 12);
                            const partes = val.split("-");
                            if (partes.length === 2) {
                              if (partes[1].length > 1) partes[1] = partes[1][0];
                              if (partes[0].length > 0) partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
                            } else if (partes.length === 1 && partes[0].length > 0) {
                              partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
                            }
                            val = partes.join("-");
                            setNuevoCliente({ ...nuevoCliente, rut: val });
                            if (rutError && val.length >= 9 && validarRUT(val)) setRutError("");
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (!val) { setRutError(""); return; }
                            const limpio = val.replace(/\./g, "").toUpperCase();
                            const tieneGuion = limpio.includes("-");
                            const match = limpio.match(/^(\d+)-([K0-9])$/);
                            if (match) { if (validarRUT(val)) setRutError(""); else setRutError("RUT inválido"); return; }
                            if (tieneGuion && !match) setRutError("RUT inválido");
                            else if (!tieneGuion && limpio.length >= 5) setRutError("Falta el guion y dígito verificador");
                            else setRutError("");
                          }} />
                      </div>
                    </div>
                    <div className="cf-r1 cf-mt">
                      <div className="cf-field">
                        <label>Dirección</label>
                        <input placeholder="Ingrese la dirección completa" value={nuevoCliente.direccion}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })} />
                      </div>
                    </div>
                    <div className="cf-r3 cf-mt">
                      <div className="cf-field">
                        <label>Ciudad</label>
                        <input placeholder="Ciudad" value={nuevoCliente.ciudad}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })} />
                      </div>
                      <div className="cf-field">
                        <label>Comuna</label>
                        <input placeholder="Comuna" value={nuevoCliente.comuna}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, comuna: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })} />
                      </div>
                      <div className="cf-field">
                        <label>Fono</label>
                        <input placeholder="Fono" value={nuevoCliente.telefono}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value.replace(/[^0-9+]/g, "") })} />
                      </div>
                    </div>
                    <div className="cf-r1 cf-mt">
                      <div className="cf-field">
                        <label>Email</label>
                        <input type="email" placeholder="Email" value={nuevoCliente.email}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="cf-sec cf-sec-contacto">
                    <h3>Datos del Contacto</h3>
                    <div className="cf-r1 cf-mt">
                      <div className="cf-field">
                        <label>Nombre Contacto</label>
                        <input placeholder="Nombre" value={nuevoCliente.contacto_nombre}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })} />
                      </div>
                    </div>
                    <div className="cf-r2 cf-mt">
                      <div className="cf-field">
                        <label>Email</label>
                        <input type="email" placeholder="Email" value={nuevoCliente.contacto_email}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_email: e.target.value })} />
                      </div>
                      <div className="cf-field">
                        <label>Fono</label>
                        <input placeholder="Fono" value={nuevoCliente.contacto_fono}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_fono: e.target.value.replace(/[^0-9+]/g, "") })} />
                      </div>
                    </div>
                    <div className="cf-r1 cf-mt">
                      <div className="cf-field">
                        <label>Cargo</label>
                        <input placeholder="Cargo" value={nuevoCliente.contacto_cargo}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_cargo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })} />
                      </div>
                    </div>
                    <div className="cf-r1 cf-mt">
                      <div className="cf-field">
                        <label>Dirección Contacto</label>
                        <input placeholder="Ingrese la dirección completa" value={nuevoCliente.contacto_direccion}
                          onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_direccion: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="cf-sec cf-sec-suc">
                  <div className="cf-sh">
                    <h3>Sucursales/Direcciones</h3>
                    {sucursalesVisibles < 5 && (
                      <button type="button" className="cf-btn-a" onClick={() => setSucursalesVisibles(sucursalesVisibles + 1)}>+ Agregar</button>
                    )}
                  </div>
                  {sucursales.slice(0, sucursalesVisibles).map((suc, idx) => (
                    <div key={idx} className="cf-sc">
                      <div className="cf-r2 cf-mb">
                        <div className="cf-field cf-m0">
                          <label>Tipo</label>
                          <select value={suc.tipo_direccion} onChange={(e) => actualizarSucursal(idx, "tipo_direccion", e.target.value)}>
                            <option value="">Seleccionar</option>
                            <option value="Matriz">Matriz</option>
                            <option value="Sucursal">Sucursal</option>
                          </select>
                        </div>
                        <div className="cf-field cf-m0">
                          <label>Dirección</label>
                          <input placeholder="Ingrese la dirección completa" value={suc.direccion} onChange={(e) => actualizarSucursal(idx, "direccion", e.target.value)} />
                        </div>
                      </div>
                      <div className="cf-r3 cf-mb">
                        <div className="cf-field cf-m0">
                          <label>Ciudad</label>
                          <input placeholder="Ciudad" value={suc.ciudad} onChange={(e) => actualizarSucursal(idx, "ciudad", e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""))} />
                        </div>
                        <div className="cf-field cf-m0">
                          <label>Fono</label>
                          <input placeholder="Fono" value={suc.fono} onChange={(e) => actualizarSucursal(idx, "fono", e.target.value.replace(/[^0-9+]/g, ""))} />
                        </div>
                        <div className="cf-field cf-m0">
                          <label>Comuna</label>
                          <input placeholder="Comuna" value={suc.comuna} onChange={(e) => actualizarSucursal(idx, "comuna", e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""))} />
                        </div>
                      </div>
                      <div className="cf-sc-del">
                        <button type="button" className="cf-btn-d" onClick={() => {
                          const nuevas = sucursales.filter((_, i) => i !== idx);
                          while (nuevas.length < 5) nuevas.push({ tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" });
                          setSucursales(nuevas);
                          setSucursalesVisibles(Math.max(1, sucursalesVisibles - 1));
                        }}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cf-sub">
                  <button type="button" className="cf-btn-c" onClick={() => { setMostrarModalCliente(false); resetModal(); }}><X size={18} /> Cancelar</button>
                  <button type="submit" className="cf-btn-p" disabled={creandoCliente}><Save size={18} /> {creandoCliente ? "Guardando..." : "Guardar Cliente"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div className="of-f">
          <label>Cliente *</label>
          <input
            type="text"
            placeholder="Nombre del cliente"
            value={nuevaOrden.cliente}
            onChange={(e) => setNuevaOrden({...nuevaOrden, cliente: e.target.value})}
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
            onChange={(e) => setNuevaOrden({...nuevaOrden, direccion: e.target.value})}
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
            onChange={(e) => setNuevaOrden({...nuevaOrden, comuna: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <div className="of-f">
          <label>Contacto</label>
          <input
            type="text"
            placeholder="Nombre del contacto"
            value={nuevaOrden.contacto}
            onChange={(e) => setNuevaOrden({...nuevaOrden, contacto: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
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
          <label>Fono Principal</label>
          <input
            type="tel"
            placeholder="Teléfono de contacto"
            value={nuevaOrden.fonoPrincipal}
            onChange={(e) => setNuevaOrden({...nuevaOrden, fonoPrincipal: e.target.value.replace(/[^0-9+]/g, '')})}
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
            onChange={(e) => setNuevaOrden({...nuevaOrden, tecnicoAsignado: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
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
    </div>
  );
}

export default OrdenFormCliente;
