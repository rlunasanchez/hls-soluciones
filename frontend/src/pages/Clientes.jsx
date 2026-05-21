import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Plus, Save, Trash2, Edit, X, Home, UserCog,
  FileText, FileSpreadsheet, ClipboardList, ShoppingCart, Package, LogOut
} from "lucide-react";
import api from "../services/api";
import "./Clientes.css";
import "../components/clientes/clientes-componentes.css";
import HeaderCliente from "../components/clientes/HeaderCliente";
import Pagination from "../components/Pagination";
import FiltrosCliente from "../components/clientes/FiltrosCliente";
import ClienteLista from "../components/clientes/ClienteLista";
import ClienteExpandido from "../components/clientes/ClienteExpandido";

function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRut, setFiltroRut] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const clientesPorPagina = 5;

  const [nuevoCliente, setNuevoCliente] = useState({
    codigo: "", razon_social: "", giro: "", rut: "", direccion: "", ciudad: "",
    comuna: "", telefono: "", email: "", contacto_nombre: "", contacto_email: "",
    contacto_fono: "", contacto_cargo: "", contacto_direccion: "", direcciones: []
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
  const [ordenesCliente, setOrdenesCliente] = useState([]);

  const ordenesPorCliente = {};
  ordenesCliente.forEach((ot) => {
    if (!ordenesPorCliente[ot.cliente_id]) ordenesPorCliente[ot.cliente_id] = [];
    ordenesPorCliente[ot.cliente_id].push(ot);
  });

  const token = localStorage.getItem("token");
  let usuarioActual = "Usuario";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      usuarioActual = payload.usuario;
    } catch {
      usuarioActual = "Usuario";
    }
  }

  /* ── helpers ──────────────────────────────── */
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

  /* ── carga de datos ───────────────────────── */
  const fetchClientes = async () => {
    try {
      const res = await api.get("/api/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    }
  };

  const fetchOrdenes = async () => {
    try {
      const res = await api.get("/api/ordenes?page=1&limit=1000");
      setOrdenesCliente(res.data.ordenes || []);
    } catch (err) {
      console.error("Error al cargar órdenes:", err);
    }
  };

  const eliminarOrdenCliente = async (id) => {
    if (!window.confirm("¿Eliminar esta orden de trabajo?")) return;
    try {
      await api.delete(`/api/ordenes/${id}`);
      fetchOrdenes();
    } catch (err) {
      alert("Error al eliminar orden");
    }
  };

  useEffect(() => {
    fetchClientes();
    fetchOrdenes();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroRut]);

  /* ── paginación / filtros ─────────────────── */
  const clientesFiltrados = clientes.filter((c) => {
    const texto = busqueda.toLowerCase();
    const razon = (c.razon_social || "").toLowerCase();
    const matchBusqueda = !texto || razon.startsWith(texto) || razon.includes(" " + texto);
    const matchRut = !filtroRut || (c.rut || "").toLowerCase().startsWith(filtroRut.toLowerCase());
    return matchBusqueda && matchRut;
  });

  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
  const indiceInicio = (paginaActual - 1) * clientesPorPagina;
  const clientesPagina = clientesFiltrados.slice(indiceInicio, indiceInicio + clientesPorPagina);

  const calcularSiguienteCodigoCliente = () => {
    let max = 0;
    clientes.forEach((c) => {
      if (c.codigo && c.codigo.startsWith("CL-")) {
        const num = parseInt(c.codigo.split("-")[1], 10);
        if (num > max) max = num;
      }
    });
    return `CL-${String(max + 1).padStart(4, "0")}`;
  };

  /* ── guardar / editar / eliminar cliente ────── */
  const guardarCliente = async (e) => {
    e.preventDefault();
    if (nuevoCliente.rut && !validarRUT(nuevoCliente.rut)) {
      alert("RUT inválido. Ejemplo: 12.345.678-9");
      return;
    }
    const dirs = sucursales.filter((s) => s.direccion.trim() !== "");
    try {
      if (clienteEditando) {
        await api.put(`/api/clientes/${clienteEditando.id}`, { ...nuevoCliente, direcciones: dirs });
        alert("Cliente actualizado");
      } else {
        await api.post("/api/clientes", { ...nuevoCliente, direcciones: dirs });
        alert("Cliente creado");
      }
      resetFormulario();
      fetchClientes();
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar");
    }
  };

  const resetFormulario = () => {
    setNuevoCliente({
      codigo: "", razon_social: "", giro: "", rut: "", direccion: "", ciudad: "", comuna: "",
      telefono: "", email: "", contacto_nombre: "", contacto_email: "", contacto_fono: "",
      contacto_cargo: "", contacto_direccion: "", direcciones: []
    });
    setClienteEditando(null);
    setMostrarFormulario(false);
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

  const editarCliente = (c) => {
    setSucursales([
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" },
      { tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" }
    ]);
    setClienteEditando(c);
    let dirs = [];
    if (c.direcciones) {
      dirs = c.direcciones.split(";;").map((d) => {
        const parts = d.split("|");
        return {
          tipo_direccion: parts[0], direccion: parts[1], fono: parts[2], ciudad: parts[3], comuna: parts[4]
        };
      }).filter((d) => d.direccion);
      if (dirs.length > 0) {
        while (dirs.length < 5) dirs.push({ tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" });
        setSucursales(dirs);
      }
    }
    setSucursalesVisibles(dirs.filter((s) => s.direccion).length || 1);
    setRutError("");
    setNuevoCliente({
      codigo: c.codigo || "", razon_social: c.razon_social, giro: c.giro || "", rut: c.rut || "",
      direccion: c.direccion || "", ciudad: c.ciudad || "", comuna: c.comuna || "",
      telefono: c.telefono || "", email: c.email || "", contacto_nombre: c.contacto_nombre || "",
      contacto_email: c.contacto_email || "", contacto_fono: c.contacto_fono || "",
      contacto_cargo: c.contacto_cargo || "", contacto_direccion: c.contacto_direccion || "",
      direcciones: dirs
    });
    setMostrarFormulario(true);
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm("¿Eliminar este cliente?")) return;
    try {
      await api.delete(`/api/clientes/${id}`);
      fetchClientes();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const actualizarSucursal = (idx, campo, valor) => {
    const nuevas = [...sucursales];
    nuevas[idx][campo] = valor;
    setSucursales(nuevas);
  };

  /* ════════════════════════════════════════════
     RENDER  –  FORMULARIO
     ════════════════════════════════════════════ */
  if (mostrarFormulario) {
    return (
      <div className="container">
        <div className="cf-wrap">
          <div className="cf-card">
            <div className="cf-head">
              <h2><Users size={24} />{clienteEditando ? "Editar Cliente" : "Nuevo Cliente"}</h2>
              <button onClick={resetFormulario}><X size={20} /></button>
            </div>
            <form onSubmit={guardarCliente} className="cf">
              <div className="cf-grid">
                <div className="cf-sec cf-sec-empresa">
                  <h3>Datos de la Empresa</h3>
                  <div className="cf-codigo" style={{ marginBottom: 6 }}>
                    <div className="cf-field">
                      <label>Código</label>
                      <input
                        value={clienteEditando ? (clienteEditando.codigo || calcularSiguienteCodigoCliente()) : calcularSiguienteCodigoCliente()}
                        disabled
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 6 }}>
                    <div className="cf-field">
                      <label>Razón Social *</label>
                      <input
                        placeholder="Razón social"
                        value={nuevoCliente.razon_social}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value })}
                        required
                      />
                    </div>
                    <div className="cf-field">
                      <label>Giro</label>
                      <input
                        placeholder="Giro"
                        value={nuevoCliente.giro}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, giro: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })}
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "200px", gap: 6, marginTop: 6 }}>
                    <div className="cf-field">
                      <label>RUT {rutError && <span style={{ color: "#dc2626", fontSize: ".72rem" }}> — {rutError}</span>}</label>
                      <input
                        placeholder="Ej: 12.345.678-9"
                        value={nuevoCliente.rut}
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
                        }}
                      />
                    </div>
                  </div>
                  <div className="cf-r1 cf-mt">
                    <div className="cf-field">
                      <label>Dirección</label>
                      <input
                        placeholder="Ingrese la dirección completa"
                        value={nuevoCliente.direccion}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="cf-r3 cf-mt">
                    <div className="cf-field">
                      <label>Ciudad</label>
                      <input
                        placeholder="Ciudad"
                        value={nuevoCliente.ciudad}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })}
                      />
                    </div>
                    <div className="cf-field">
                      <label>Comuna</label>
                      <input
                        placeholder="Comuna"
                        value={nuevoCliente.comuna}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, comuna: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })}
                      />
                    </div>
                    <div className="cf-field">
                      <label>Fono</label>
                      <input
                        placeholder="Fono"
                        value={nuevoCliente.telefono}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value.replace(/[^0-9+]/g, "") })}
                      />
                    </div>
                  </div>
                  <div className="cf-r1 cf-mt">
                    <div className="cf-field">
                      <label>Email</label>
                      <input
                        type="email"
                        placeholder="Email"
                        value={nuevoCliente.email}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="cf-sec cf-sec-contacto">
                  <h3>Datos del Contacto</h3>
                  <div className="cf-r1 cf-mt">
                    <div className="cf-field">
                      <label>Nombre Contacto</label>
                      <input
                        placeholder="Nombre"
                        value={nuevoCliente.contacto_nombre}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })}
                      />
                    </div>
                  </div>
                  <div className="cf-r2 cf-mt">
                    <div className="cf-field">
                      <label>Email</label>
                      <input
                        type="email"
                        placeholder="Email"
                        value={nuevoCliente.contacto_email}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_email: e.target.value })}
                      />
                    </div>
                    <div className="cf-field">
                      <label>Fono</label>
                      <input
                        placeholder="Fono"
                        value={nuevoCliente.contacto_fono}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_fono: e.target.value.replace(/[^0-9+]/g, "") })}
                      />
                    </div>
                  </div>
                  <div className="cf-r1 cf-mt">
                    <div className="cf-field">
                      <label>Cargo</label>
                      <input
                        placeholder="Cargo"
                        value={nuevoCliente.contacto_cargo}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_cargo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "") })}
                      />
                    </div>
                  </div>
                  <div className="cf-r1 cf-mt">
                    <div className="cf-field">
                      <label>Dirección Contacto</label>
                      <input
                        placeholder="Ingrese la dirección completa"
                        value={nuevoCliente.contacto_direccion}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_direccion: e.target.value })}
                      />
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
                      <button
                        type="button"
                        className="cf-btn-d"
                        onClick={() => {
                          const nuevas = sucursales.filter((_, i) => i !== idx);
                          while (nuevas.length < 5) nuevas.push({ tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" });
                          setSucursales(nuevas);
                          setSucursalesVisibles(Math.max(1, sucursalesVisibles - 1));
                        }}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cf-sub">
                <button type="button" className="cf-btn-c" onClick={resetFormulario}><X size={18} /> Cancelar</button>
                <button type="submit" className="cf-btn-p"><Save size={18} /> {clienteEditando ? "Guardar Cambios" : "Guardar Cliente"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     RENDER  –  LISTADO
     ════════════════════════════════════════════ */
  return (
    <div className="container">
      <HeaderCliente usuarioActual={usuarioActual} onLogout={() => { localStorage.removeItem("token"); navigate("/login"); }} />

      <FiltrosCliente
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        filtroRut={filtroRut}
        onFiltroRutChange={setFiltroRut}
        onLimpiar={() => { setBusqueda(""); setFiltroRut(""); }}
      />

      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
        <button className="btn-nuevo-cliente" onClick={() => { setMostrarFormulario(true); setSucursalesVisibles(1); setRutError(""); setNuevoCliente({ codigo: "", razon_social: "", giro: "", rut: "", direccion: "", ciudad: "", comuna: "", telefono: "", email: "", contacto_nombre: "", contacto_email: "", contacto_fono: "", contacto_cargo: "", contacto_direccion: "", direcciones: [] }); }}>
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      {/* Vista expandida con OTs (búsqueda activa) */}
      {(busqueda || filtroRut) && clientesPagina.length > 0 && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          {clientesPagina.map((c) => (
            <ClienteExpandido
              key={c.id}
              cliente={c}
              ordenes={ordenesPorCliente[c.id] || []}
              onEliminar={eliminarCliente}
              onEditar={() => editarCliente(c)}
              onEliminarOT={eliminarOrdenCliente}
            />
          ))}
        </div>
      )}

      {/* Vista tabla normal */}
      {!busqueda && !filtroRut && (
        <ClienteLista
          clientes={clientesPagina}
          onNuevaOT={(c) => navigate("/orden-trabajo", { state: { cliente: c } })}
          onCotizacion={(c) => navigate("/cotizaciones", { state: { cliente: c } })}
          onEditar={editarCliente}
          onEliminar={eliminarCliente}
        />
      )}

      {clientesFiltrados.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <p>No hay clientes que coincidan con la búsqueda</p>
        </div>
      )}

      <Pagination currentPage={paginaActual} totalPages={totalPaginas} onPageChange={setPaginaActual} />
    </div>
  );
}

export default Clientes;
