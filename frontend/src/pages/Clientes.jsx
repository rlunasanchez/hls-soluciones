import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Save, Trash2, Edit, LogOut, Search, ChevronDown, ChevronUp, Home, Package, UserCog, FileText, FileSpreadsheet, ClipboardList, X, ShoppingCart } from "lucide-react";
import api from "../services/api";

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
    codigo: "",
    razon_social: "",
    giro: "",
    rut: "",
    direccion: "",
    ciudad: "",
    comuna: "",
    telefono: "",
    contacto_nombre: "",
    contacto_email: "",
    contacto_fono: "",
    contacto_cargo: "",
    contacto_direccion: "",
    direcciones: []
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

  const [todosEquipos, setTodosEquipos] = useState([]);
  const [mostrarModalEquipo, setMostrarModalEquipo] = useState(false);
  const [modalEquipoClienteId, setModalEquipoClienteId] = useState(null);
  const [insumosModal, setInsumosModal] = useState([
    { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
    { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
    { nombre: "" }, { nombre: "" }, { nombre: "" }
  ]);
  const [insumosVisiblesModal, setInsumosVisiblesModal] = useState(2);
  const [codigoEquipoModal, setCodigoEquipoModal] = useState("");
  const [nuevoEquipoModal, setNuevoEquipoModal] = useState({
    equipo: "", marca: "", modelo: "", serie: "", contador_pag: 0, nivel_tintas: "", averia: "",
    insumo1: "", insumo2: "", insumo3: "", insumo4: "", insumo5: "", insumo6: "",
    insumo7: "", insumo8: "", insumo9: "", insumo10: "", insumo11: "", insumo12: ""
  });
  const [equiposExpandidos, setEquiposExpandidos] = useState({});
  const [equipoEditandoModal, setEquipoEditandoModal] = useState(null);

  const equiposPorCliente = {};
  todosEquipos.forEach(eq => {
    if (!equiposPorCliente[eq.cliente_id]) equiposPorCliente[eq.cliente_id] = [];
    equiposPorCliente[eq.cliente_id].push(eq);
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

  /**
   * Valida formato RUT chileno (empresa o persona natural)
   * @param {string} rut - RUT en formato 12.345.678-9 o 12.345.678-K
   * @returns {boolean} true si es válido
   */
  const validarRUT = (rut) => {
    if (!rut) return false;
    const limpio = rut.replace(/\./g, '').toUpperCase();
    const match = limpio.match(/^(\d+)-([K0-9])$/);
    if (!match) return false;
    const num = parseInt(match[1], 10);
    if (num < 100000) return false;
    const dv = match[2];
    let suma = 0, mul = 2;
    const digits = String(num).split('').reverse().join('');
    for (let i = 0; i < digits.length; i++) {
      suma += parseInt(digits[i], 10) * mul;
      mul = mul === 7 ? 2 : mul + 1;
    }
    const res = 11 - (suma % 11);
    const esperado = res === 11 ? '0' : res === 10 ? 'K' : String(res);
    return dv === esperado;
  };

  /**
   * Carga la lista de clientes desde el API
   * @async
   */
  const fetchClientes = async () => {
    try {
      const res = await api.get("/api/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    }
  };

  /**
   * Carga la lista de equipos desde el API
   * @async
   */
  const fetchEquipos = async () => {
    try {
      const res = await api.get("/api/equipos");
      setTodosEquipos(res.data);
    } catch (err) {
      console.error("Error al cargar equipos:", err);
    }
  };

  /**
   * Calcula el siguiente código de cliente disponible (CL-XXXX)
   * Busca el máximo número existente y suma 1
   * @returns {string} Código formateado como CL-XXXX
   */
  const calcularSiguienteCodigoCliente = () => {
    let max = 0;
    clientes.forEach(c => {
      if (c.codigo && c.codigo.startsWith("CL-")) {
        const num = parseInt(c.codigo.split("-")[1], 10);
        if (num > max) max = num;
      }
    });
    return `CL-${String(max + 1).padStart(4, "0")}`;
  };

  const clientesFiltrados = clientes.filter(c => {
    const texto = busqueda.toLowerCase();
    const matchBusqueda = !texto ||
      c.razon_social?.toLowerCase().includes(texto) ||
      c.codigo?.toLowerCase().includes(texto) ||
      c.contacto_nombre?.toLowerCase().includes(texto);
    const matchRut = !filtroRut || c.rut?.toLowerCase().includes(filtroRut.toLowerCase());
    return matchBusqueda && matchRut;
  });

  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
  const indiceInicio = (paginaActual - 1) * clientesPorPagina;
  const clientesPagina = clientesFiltrados.slice(indiceInicio, indiceInicio + clientesPorPagina);

  useEffect(() => {
    fetchClientes();
    fetchEquipos();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroRut]);

  /**
   * Cierra la sesión del usuario y redirige al login
   */
  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /**
   * Guarda un cliente nuevo o actualiza uno existente
   * @param {Event} e - Evento del formulario
   * @async
   */
  const guardarCliente = async (e) => {
    e.preventDefault();
    if (nuevoCliente.rut && !validarRUT(nuevoCliente.rut)) {
      alert("RUT inválido. Ejemplo: 12.345.678-9");
      return;
    }
    const dirs = sucursales.filter(s => s.direccion.trim() !== "");
    try {
      if (clienteEditando) {
        await api.put(`/api/clientes/${clienteEditando.id}`, { ...nuevoCliente, direcciones: dirs });
        alert("Cliente actualizado");
      } else {
        await api.post("/api/clientes", { ...nuevoCliente, direcciones: dirs });
        alert("Cliente creado");
      }
      setNuevoCliente({
        codigo: "", razon_social: "", giro: "", rut: "", direccion: "", ciudad: "", comuna: "", telefono: "",
        contacto_nombre: "", contacto_email: "", contacto_fono: "", contacto_cargo: "", contacto_direccion: "", direcciones: []
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
      fetchClientes();
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar");
    }
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
      dirs = c.direcciones.split(";;").map(d => {
        const parts = d.split("|");
        return { tipo_direccion: parts[0], direccion: parts[1], fono: parts[2], ciudad: parts[3], comuna: parts[4] };
      }).filter(d => d.tipo_direccion);
      if (dirs.length > 0) {
        while (dirs.length < 5) {
          dirs.push({ tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" });
        }
        setSucursales(dirs);
      }
    }
    setSucursalesVisibles(dirs.filter(s => s.direccion).length || 1);
    setRutError("");
    setNuevoCliente({
      codigo: c.codigo || "",
      razon_social: c.razon_social,
      giro: c.giro || "",
      rut: c.rut || "",
      direccion: c.direccion || "",
      ciudad: c.ciudad || "",
      comuna: c.comuna || "",
      telefono: c.telefono || "",
      contacto_nombre: c.contacto_nombre || "",
      contacto_email: c.contacto_email || "",
      contacto_fono: c.contacto_fono || "",
      contacto_cargo: c.contacto_cargo || "",
      contacto_direccion: c.contacto_direccion || "",
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

  /**
   * Actualiza el valor de un campo específico de una sucursal
   * @param {number} idx - Índice de la sucursal
   * @param {string} campo - Nombre del campo a actualizar
   * @param {string} valor - Nuevo valor
   */
  const actualizarSucursal = (idx, campo, valor) => {
    const nuevas = [...sucursales];
    nuevas[idx][campo] = valor;
    setSucursales(nuevas);
  };

  /**
   * Elimina un equipo asociado a un cliente
   * @param {number} id - ID del equipo a eliminar
   * @async
   */
  const eliminarEquipoDeCliente = async (id) => {
    if (!window.confirm("¿Eliminar este equipo?")) return;
    try {
      await api.delete(`/api/equipos/${id}`);
      fetchEquipos();
    } catch (err) {
      alert("Error al eliminar equipo");
    }
  };

  /**
   * Calcula el siguiente código de equipo disponible (EQ-XXXX)
   * @returns {string} Código formateado como EQ-XXXX
   */
  const calcularSiguienteCodigoEquipo = () => {
    let max = 0;
    todosEquipos.forEach(eq => {
      if (eq.codigo && eq.codigo.startsWith("EQ-")) {
        const num = parseInt(eq.codigo.split("-")[1], 10);
        if (num > max) max = num;
      }
    });
    return `EQ-${String(max + 1).padStart(4, "0")}`;
  };

  /**
   * Guarda un equipo nuevo o actualiza uno existente desde el modal
   * @param {Event} e - Evento del formulario
   * @async
   */
  const guardarEquipoModal = async (e) => {
    e.preventDefault();
    const ins = insumosModal.filter(i => i.nombre.trim() !== "").map(i => i.nombre);
    const payload = {
      ...nuevoEquipoModal,
      insumo1: ins[0] || "",
      insumo2: ins[1] || "",
      insumo3: ins[2] || "",
      insumo4: ins[3] || "",
      insumo5: ins[4] || "",
      insumo6: ins[5] || "",
      insumo7: ins[6] || "",
      insumo8: ins[7] || "",
      insumo9: ins[8] || "",
      insumo10: ins[9] || "",
      insumo11: ins[10] || "",
      insumo12: ins[11] || "",
      cliente_id: modalEquipoClienteId
    };
    try {
      if (equipoEditandoModal) {
        await api.put(`/api/equipos/${equipoEditandoModal.id}`, payload);
      } else {
        await api.post("/api/equipos", payload);
      }
      setMostrarModalEquipo(false);
      setModalEquipoClienteId(null);
      setEquipoEditandoModal(null);
      setNuevoEquipoModal({
        equipo: "", marca: "", modelo: "", serie: "", contador_pag: 0, nivel_tintas: "", averia: "",
        insumo1: "", insumo2: "", insumo3: "", insumo4: "", insumo5: "", insumo6: "",
        insumo7: "", insumo8: "", insumo9: "", insumo10: "", insumo11: "", insumo12: ""
      });
      setInsumosModal([
        { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
        { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
        { nombre: "" }, { nombre: "" }, { nombre: "" }
      ]);
      setInsumosVisiblesModal(2);
      fetchEquipos();
    } catch (err) {
      alert("Error al guardar equipo");
    }
  };

  /**
   * Abre el modal para crear un nuevo equipo asociado a un cliente
   * @param {number} clienteId - ID del cliente al que se asociará el equipo
   */
  const abrirModalEquipo = (clienteId) => {
    setModalEquipoClienteId(clienteId);
    setEquipoEditandoModal(null);
    setCodigoEquipoModal(calcularSiguienteCodigoEquipo());
    setNuevoEquipoModal({
      equipo: "", marca: "", modelo: "", serie: "", contador_pag: 0, nivel_tintas: "", averia: "",
      insumo1: "", insumo2: "", insumo3: "", insumo4: "", insumo5: "", insumo6: "",
      insumo7: "", insumo8: "", insumo9: "", insumo10: "", insumo11: "", insumo12: ""
    });
    setInsumosModal([
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
      { nombre: "" }, { nombre: "" }, { nombre: "" }
    ]);
    setInsumosVisiblesModal(2);
    setMostrarModalEquipo(true);
  };

  /**
   * Abre el modal para editar un equipo existente
   * @param {Object} equipo - Objeto con los datos del equipo a editar
   */
  const abrirModalEditarEquipo = (equipo) => {
    setModalEquipoClienteId(equipo.cliente_id);
    setEquipoEditandoModal(equipo);
    setCodigoEquipoModal(equipo.codigo);
    setNuevoEquipoModal({
      equipo: equipo.equipo || "",
      marca: equipo.marca || "",
      modelo: equipo.modelo || "",
      serie: equipo.serie || "",
      contador_pag: equipo.contador_pag || 0,
      nivel_tintas: equipo.nivel_tintas || "",
      averia: equipo.averia || "",
      insumo1: equipo.insumo1 || "",
      insumo2: equipo.insumo2 || "",
      insumo3: equipo.insumo3 || "",
      insumo4: equipo.insumo4 || "",
      insumo5: equipo.insumo5 || "",
      insumo6: equipo.insumo6 || "",
      insumo7: equipo.insumo7 || "",
      insumo8: equipo.insumo8 || "",
      insumo9: equipo.insumo9 || "",
      insumo10: equipo.insumo10 || "",
      insumo11: equipo.insumo11 || "",
      insumo12: equipo.insumo12 || ""
    });
    const arr = [
      { nombre: equipo.insumo1 || "" }, { nombre: equipo.insumo2 || "" }, { nombre: equipo.insumo3 || "" },
      { nombre: equipo.insumo4 || "" }, { nombre: equipo.insumo5 || "" }, { nombre: equipo.insumo6 || "" },
      { nombre: equipo.insumo7 || "" }, { nombre: equipo.insumo8 || "" }, { nombre: equipo.insumo9 || "" },
      { nombre: equipo.insumo10 || "" }, { nombre: equipo.insumo11 || "" }, { nombre: equipo.insumo12 || "" }
    ];
    setInsumosModal(arr);
    setInsumosVisiblesModal(arr.filter(i => i.nombre).length || 2);
    setMostrarModalEquipo(true);
  };

  if (mostrarFormulario) {
    return (
      <div className="container">
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gradient)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <Users size={28} />
                {clienteEditando ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button 
                type="button" 
                  onClick={() => {
                    setMostrarFormulario(false);
                    setClienteEditando(null);
                    setSucursalesVisibles(1);
                    setRutError("");
                    setNuevoCliente({
                      codigo: "", razon_social: "", giro: "", rut: "", direccion: "", ciudad: "", comuna: "", telefono: "",
                      contacto_nombre: "", contacto_email: "", contacto_fono: "", contacto_cargo: "", contacto_direccion: "", direcciones: []
                    });
                }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: 'white' }}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={guardarCliente} style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div style={{ padding: '20px', background: 'var(--primary-light)', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '16px' }}>Datos de la Empresa</h3>
                <div style={{ marginBottom: '16px' }}>
                  <div className="form-group" style={{ maxWidth: '200px' }}>
                    <label>Código</label>
                    <input
                      value={clienteEditando ? (clienteEditando.codigo || calcularSiguienteCodigoCliente()) : calcularSiguienteCodigoCliente()}
                      disabled
                      style={{ background: '#e8f0fe', color: '#1a73e8', fontWeight: '700', fontSize: '1.1rem' }}
                    />
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Razón Social *</label>
                    <input
                      placeholder="Razón social"
                      value={nuevoCliente.razon_social}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Giro</label>
                    <input
                      placeholder="Giro"
                      value={nuevoCliente.giro}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, giro: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                    />
                  </div>
                  <div className="form-group">
                    <label>RUT {rutError && <span style={{ color: 'red', fontSize: '0.75rem' }}> — {rutError}</span>}</label>
                    <input
                      placeholder="Ej: 12.345.678-9"
                      value={nuevoCliente.rut}
                      style={rutError ? { border: '2px solid red', background: '#FEF2F2' } : {}}
                      onChange={(e) => {
                        let val = e.target.value.toUpperCase().replace(/[^0-9K-]/g, '');
                        if (val.length > 12) val = val.slice(0, 12);
                        const partes = val.split('-');
                        if (partes.length === 2) {
                          if (partes[1].length > 1) partes[1] = partes[1][0];
                          if (partes[0].length > 0) partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                        } else if (partes.length === 1 && partes[0].length > 0) {
                          partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                        }
                        val = partes.join('-');
                        setNuevoCliente({ ...nuevoCliente, rut: val });
                        if (rutError && val.length >= 9 && validarRUT(val)) {
                          setRutError("");
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (!val) { setRutError(""); return; }
                        const limpio = val.replace(/\./g, '').toUpperCase();
                        const tieneGuion = limpio.includes('-');
                        const match = limpio.match(/^(\d+)-([K0-9])$/);
                        if (match) {
                          if (validarRUT(val)) { setRutError(""); }
                          else { setRutError("RUT inválido"); }
                          return;
                        }
                        if (tieneGuion && !match) { setRutError("RUT inválido"); }
                        else if (!tieneGuion && limpio.length >= 5) { setRutError("Falta el guion y dígito verificador"); }
                        else { setRutError(""); }
                      }}
                    />
                  </div>
                </div>
                <div className="form-row-1" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Dirección</label>
                    <input
                      placeholder="Ingrese la dirección completa"
                      value={nuevoCliente.direccion}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <div className="form-row-3" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Ciudad</label>
                    <input
                      placeholder="Ciudad"
                      value={nuevoCliente.ciudad}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, ciudad: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Comuna</label>
                    <input
                      placeholder="Comuna"
                      value={nuevoCliente.comuna}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, comuna: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fono</label>
                    <input
                      placeholder="Fono"
                      value={nuevoCliente.telefono}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value.replace(/[^0-9+]/g, '') })}
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px', background: 'var(--success-light)', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--success)', marginBottom: '16px', fontSize: '16px' }}>Datos del Contacto</h3>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Nombre Contacto</label>
                    <input
                      placeholder="Nombre"
                      value={nuevoCliente.contacto_nombre}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={nuevoCliente.contacto_email}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fono</label>
                    <input
                      placeholder="Fono"
                      value={nuevoCliente.contacto_fono}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_fono: e.target.value.replace(/[^0-9+]/g, '') })}
                    />
                  </div>
                </div>
                <div className="form-row-3" style={{ marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Cargo</label>
                    <input
                      placeholder="Cargo"
                      value={nuevoCliente.contacto_cargo}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_cargo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Dirección Contacto</label>
                    <input
                      placeholder="Dirección"
                      value={nuevoCliente.contacto_direccion}
                      onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto_direccion: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px', background: '#F1F5F9', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ color: 'var(--text)', margin: 0, fontSize: '16px' }}>Sucursales/Direcciones</h3>
                  {sucursalesVisibles < 5 && (
                    <button 
                      type="button" 
                      className="secondary-btn"
                      style={{ padding: '8px 16px' }}
                      onClick={() => setSucursalesVisibles(sucursalesVisibles + 1)}
                    >
                      + Agregar
                    </button>
                  )}
                </div>
                {sucursales.slice(0, sucursalesVisibles).map((suc, idx) => (
                  <div key={idx} style={{ marginBottom: '12px', padding: '12px', background: 'white', borderRadius: '8px' }}>
                    {/* Fila 1: Tipo y Dirección */}
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Tipo</label>
                        <select
                          value={suc.tipo_direccion}
                          onChange={(e) => actualizarSucursal(idx, 'tipo_direccion', e.target.value)}
                        >
                          <option value="">Seleccionar</option>
                          <option value="Matriz">Matriz</option>
                          <option value="Sucursal">Sucursal</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Dirección</label>
                        <input
                          placeholder="Ingrese la dirección completa"
                          value={suc.direccion}
                          onChange={(e) => actualizarSucursal(idx, 'direccion', e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    {/* Fila 2: Fono, Ciudad, Comuna y Eliminar */}
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr 1fr 50px', gap: '12px', alignItems: 'end' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Fono</label>
                        <input
                          placeholder="Fono"
                          value={suc.fono}
                          onChange={(e) => actualizarSucursal(idx, 'fono', e.target.value.replace(/[^0-9+]/g, ''))}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Ciudad</label>
                        <input
                          placeholder="Ciudad"
                          value={suc.ciudad}
                          onChange={(e) => actualizarSucursal(idx, 'ciudad', e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label>Comuna</label>
                        <input
                          placeholder="Comuna"
                          value={suc.comuna}
                          onChange={(e) => actualizarSucursal(idx, 'comuna', e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))}
                        />
                      </div>
                      <button
                        type="button"
                        className="delete-btn"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px' }}
                        onClick={() => {
                          const nuevas = sucursales.filter((_, i) => i !== idx);
                          while (nuevas.length < 5) {
                            nuevas.push({ tipo_direccion: "", direccion: "", fono: "", ciudad: "", comuna: "" });
                          }
                          setSucursales(nuevas);
                          setSucursalesVisibles(Math.max(1, sucursalesVisibles - 1));
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="cancel-btn" onClick={() => {
                  setMostrarFormulario(false);
                  setClienteEditando(null);
                  setSucursalesVisibles(1);
                  setRutError("");
                  setNuevoCliente({
                    codigo: "", razon_social: "", giro: "", rut: "", direccion: "", ciudad: "", comuna: "", telefono: "",
                    contacto_nombre: "", contacto_email: "", contacto_fono: "", contacto_cargo: "", contacto_direccion: "", direcciones: []
                  });
                }}>
                  <X size={20} /> Cancelar
                </button>
                <button type="submit" className="main-btn">
                  <Save size={20} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
        <div className="header-left">
          <h1 style={{ color: 'white' }}><Users size={28} /> Mantenedor de Clientes</h1>
        </div>
        <div className="nav-buttons" style={{ gap: '10px' }}>
          <button onClick={() => navigate("/home")} className="logout-btn" style={{ background: 'var(--primary)', color: 'white' }}>
            <Home size={18} />
            <span className="btn-label">Inicio</span>
          </button>
          <button onClick={() => navigate("/equipos")} className="logout-btn" style={{ background: 'var(--success)', color: 'white' }}>
            <Package size={18} />
            <span className="btn-label">Equipos</span>
          </button>
          <button onClick={() => navigate("/orden-trabajo")} className="logout-btn" style={{ background: '#6366F1', color: 'white' }}>
            <ClipboardList size={18} />
            <span className="btn-label">Orden de Trabajo</span>
          </button>
          <button onClick={() => navigate("/informes")} className="logout-btn" style={{ background: '#EA580C', color: 'white' }}>
            <FileText size={18} />
            <span className="btn-label">Informes Técnicos</span>
          </button>
          <button onClick={() => navigate("/cotizaciones")} className="logout-btn" style={{ background: '#DB2777', color: 'white' }}>
            <FileSpreadsheet size={18} />
            <span className="btn-label">Cotizaciones</span>
          </button>
          <button onClick={() => navigate("/orden-compra")} className="logout-btn" style={{ background: '#8B5CF6', color: 'white' }}>
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

      <div className="filters-section">
        <div className="filters-content">
          <div className="filter-group">
            <label>Razón Social</label>
            <input
              type="text"
              placeholder="Filtrar por razón social..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>RUT</label>
            <input
              type="text"
              placeholder="Filtrar por RUT..."
              value={filtroRut}
              onChange={(e) => setFiltroRut(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-header">
        <button onClick={() => { setMostrarFormulario(true); setSucursalesVisibles(1); setRutError(""); setNuevoCliente({
          codigo: "", razon_social: "", giro: "", rut: "", direccion: "", ciudad: "", comuna: "", telefono: "",
          contacto_nombre: "", contacto_email: "", contacto_fono: "", contacto_cargo: "", contacto_direccion: "", direcciones: []
        }); }} className="main-btn">
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Vista expandida con equipos detallados cuando hay búsqueda */}
      {(busqueda || filtroRut) && clientesPagina.length > 0 && (
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {clientesPagina.map((c) => {
            const equiposCliente = equiposPorCliente[c.id] || [];
            const expandido = equiposExpandidos[c.id];
            return (
              <div key={c.id} style={{ background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                {/* Header del cliente */}
                <div style={{ background: 'var(--gradient)', padding: '20px 24px', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={20} />
                        {c.codigo ? `${c.codigo} - ` : ''}{c.razon_social}
                      </h3>
                      <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                        RUT: {c.rut || 'N/A'} | {c.ciudad}{c.comuna ? `, ${c.comuna}` : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="table-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }} onClick={() => abrirModalEquipo(c.id)}>
                        <Package size={14} /> Agregar Equipo
                      </button>
                      <button className="table-btn edit-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} onClick={() => editarCliente(c)}>
                        <Edit size={14} /> Editar
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Datos del cliente */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dirección</label>
                    <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{c.direccion || '-'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Teléfono</label>
                    <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{c.telefono || '-'}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contacto</label>
                    <p style={{ margin: '4px 0 0', fontWeight: 500 }}>{c.contacto_nombre || '-'}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.contacto_email || c.contacto_fono || ''}</p>
                  </div>
                </div>
                
                {/* Tabla de equipos */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={18} style={{ color: 'var(--success)' }} />
                      Equipos Asociados ({equiposCliente.length})
                    </h4>
                    {equiposCliente.length > 0 && (
                      <button 
                        onClick={() => setEquiposExpandidos(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                        style={{ 
                          background: 'var(--primary-light)', 
                          color: 'var(--primary)', 
                          border: 'none', 
                          borderRadius: '6px', 
                          padding: '6px 12px', 
                          fontSize: '0.85rem', 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {expandido ? 'Ocultar' : 'Ver equipos'}
                      </button>
                    )}
                  </div>
                  {expandido && equiposCliente.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--success-light)' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--success)' }}>Código</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--success)' }}>Equipo</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--success)' }}>Marca</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--success)' }}>Modelo</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: 'var(--success)' }}>Serie</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: 'var(--success)', width: '100px' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {equiposCliente.map((eq) => (
                            <tr key={eq.id} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{eq.codigo}</span>
                              </td>
                              <td style={{ padding: '10px 12px' }}>{eq.equipo}</td>
                              <td style={{ padding: '10px 12px' }}>{eq.marca}</td>
                              <td style={{ padding: '10px 12px' }}>{eq.modelo}</td>
                              <td style={{ padding: '10px 12px' }}>{eq.serie || '-'}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button onClick={() => abrirModalEditarEquipo(eq)} 
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                                    title="Editar equipo">
                                    <Edit size={16} />
                                  </button>
                                  <button onClick={() => eliminarEquipoDeCliente(eq.id)} 
                                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                                    title="Eliminar equipo">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {equiposCliente.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: '8px' }}>
                      <Package size={32} style={{ opacity: 0.5 }} />
                      <p style={{ margin: '8px 0 0' }}>Este cliente no tiene equipos asociados</p>
                      <button className="main-btn" style={{ marginTop: '12px', padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => abrirModalEquipo(c.id)}>
                        <Package size={16} /> Agregar primer equipo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vista normal de tabla (sin búsqueda) */}
      {!busqueda && !filtroRut && (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Razón Social</th>
                  <th>RUT</th>
                  <th>Teléfono</th>
                  <th>Ciudad</th>
                  <th>Contacto</th>
                  <th>Equipos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesPagina.map((c) => (
                  <tr key={c.id}>
                    <td data-label="Código"><span style={{ fontWeight: '600', color: 'var(--primary)' }}>{c.codigo || '-'}</span></td>
                    <td data-label="Razón Social">{c.razon_social}</td>
                    <td data-label="RUT">{c.rut}</td>
                    <td data-label="Teléfono">{c.telefono}</td>
                    <td data-label="Ciudad">{c.ciudad}</td>
                    <td data-label="Contacto">{c.contacto_nombre}</td>
                    <td data-label="Equipos">
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        {(equiposPorCliente[c.id] || []).slice(0, 2).map((eq, index, arr) => (
                          <span key={eq.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span className="badge badge-success" style={{ fontSize: 11, padding: '2px 6px' }}>
                              {eq.codigo}
                            </span>
                            {index < arr.length - 1 && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                          </span>
                        ))}
                        {(equiposPorCliente[c.id] || []).length > 2 && (
                          <span className="badge badge-success" style={{ fontSize: 11, padding: '2px 6px', opacity: 0.7 }}>
                            +{(equiposPorCliente[c.id] || []).length - 2} más
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Acciones">
                      <div className="action-buttons">
                        <button className="table-btn" style={{ background: 'var(--success-light)', color: 'var(--success)' }} onClick={() => abrirModalEquipo(c.id)}>
                          <Package size={14} /> Agregar
                        </button>
                        <button className="table-btn edit-btn" onClick={() => editarCliente(c)}>
                          <Edit size={14} /> Editar
                        </button>
                        <button className="table-btn delete-btn" onClick={() => eliminarCliente(c.id)}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista de tarjetas para móvil */}
          <div className="cards-table">
            {clientesPagina.map((c) => (
              <div key={c.id} className="data-card">
                <div className="data-card-header">
                  <strong>{c.codigo ? `${c.codigo} - ` : ''}{c.razon_social}</strong>
                  <span className="badge badge-primary">{c.rut}</span>
                </div>
                <div className="data-card-row">
                  <span className="data-card-label">Teléfono</span>
                  <span className="data-card-value">{c.telefono}</span>
                </div>
                <div className="data-card-row">
                  <span className="data-card-label">Ciudad</span>
                  <span className="data-card-value">{c.ciudad}</span>
                </div>
                <div className="data-card-row">
                  <span className="data-card-label">Contacto</span>
                  <span className="data-card-value">{c.contacto_nombre}</span>
                </div>
                <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Equipos ({(equiposPorCliente[c.id] || []).length})</strong>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(equiposPorCliente[c.id] || []).slice(0, 2).map((eq, index, arr) => (
                      <span key={eq.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="badge badge-success" style={{ fontSize: 11, padding: '2px 6px' }}>
                          {eq.codigo}
                        </span>
                        {index < arr.length - 1 && <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      </span>
                    ))}
                    {(equiposPorCliente[c.id] || []).length > 2 && (
                      <span className="badge badge-success" style={{ fontSize: 11, padding: '2px 6px', opacity: 0.7 }}>
                        +{(equiposPorCliente[c.id] || []).length - 2} más
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="table-btn" onClick={() => abrirModalEquipo(c.id)} style={{ flex: 1, justifyContent: 'center', background: 'var(--success-light)', color: 'var(--success)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                    <Package size={14} /> Agregar
                  </button>
                  <button className="table-btn edit-btn" onClick={() => editarCliente(c)} style={{ flex: 1, justifyContent: 'center' }}>
                    <Edit size={14} /> Editar
                  </button>
                  <button className="table-btn delete-btn" onClick={() => eliminarCliente(c.id)} style={{ flex: 1, justifyContent: 'center' }}>
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {clientesFiltrados.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <p>No hay clientes</p>
        </div>
      )}

      {totalPaginas > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Mostrando {indiceInicio + 1}-{Math.min(indiceInicio + clientesPorPagina, clientesFiltrados.length)} de {clientesFiltrados.length} clientes
          </div>
          <div className="pagination-controls">
            <button className="page-btn-nav" onClick={() => setPaginaActual(paginaActual - 1)} disabled={paginaActual === 1}>‹</button>
            <span className="page-numbers-desktop">
              {[...Array(totalPaginas)].map((_, i) => (
                <button key={i + 1} onClick={() => setPaginaActual(i + 1)} className={paginaActual === i + 1 ? 'active' : ''}>{i + 1}</button>
              ))}
            </span>
            <button className="page-btn-nav" onClick={() => setPaginaActual(paginaActual + 1)} disabled={paginaActual === totalPaginas}>›</button>
          </div>
        </div>
      )}

      {mostrarModalEquipo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }} onClick={() => setMostrarModalEquipo(false)}>
          <div style={{
            background: 'white', borderRadius: '16px', maxWidth: '800px', width: '100%',
            maxHeight: '90vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'var(--gradient)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
                <Package size={24} />
                {equipoEditandoModal ? "Editar Equipo" : "Agregar Equipo"}
              </h2>
              <button type="button" onClick={() => {
                  setMostrarModalEquipo(false);
                  setEquipoEditandoModal(null);
                }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'white' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={guardarEquipoModal} style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--primary-light)', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '12px', fontSize: '15px' }}>Información del Equipo</h3>
                <div style={{ marginBottom: '12px', padding: '12px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0, flex: '0 0 auto' }}>
                    <label>Código</label>
                    <input value={codigoEquipoModal} disabled
                      style={{ background: '#e8f0fe', color: '#1a73e8', fontWeight: '700', fontSize: '1rem', width: '140px' }} />
                  </div>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label>Cliente Asociado</label>
                    <input value={clientes.find(c => c.id === modalEquipoClienteId)?.razon_social || ''} disabled
                      style={{ background: '#f3f4f6', fontWeight: '500' }} />
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label>Equipo *</label>
                    <input placeholder="Nombre del equipo" value={nuevoEquipoModal.equipo}
                      onChange={e => setNuevoEquipoModal({...nuevoEquipoModal, equipo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})} required />
                  </div>
                  <div className="form-group">
                    <label>Marca *</label>
                    <input placeholder="Marca" value={nuevoEquipoModal.marca}
                      onChange={e => setNuevoEquipoModal({...nuevoEquipoModal, marca: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})} required />
                  </div>
                  <div className="form-group">
                    <label>Modelo *</label>
                    <input placeholder="Modelo" value={nuevoEquipoModal.modelo}
                      onChange={e => setNuevoEquipoModal({...nuevoEquipoModal, modelo: e.target.value})} required />
                  </div>
                </div>
                <div className="form-row-3" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label>Serie</label>
                    <input placeholder="Número de serie" value={nuevoEquipoModal.serie}
                      onChange={e => setNuevoEquipoModal({...nuevoEquipoModal, serie: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Contador Páginas</label>
                    <input type="number" placeholder="Contador" value={nuevoEquipoModal.contador_pag}
                      onChange={e => setNuevoEquipoModal({...nuevoEquipoModal, contador_pag: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Nivel Tintas</label>
                    <input placeholder="Nivel de tintas" value={nuevoEquipoModal.nivel_tintas}
                      onChange={e => setNuevoEquipoModal({...nuevoEquipoModal, nivel_tintas: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})} />
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px', background: 'var(--success-light)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ color: 'var(--success)', margin: 0, fontSize: '15px' }}>Insumos</h3>
                  {insumosVisiblesModal < 12 && (
                    <button type="button" className="secondary-btn" style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => setInsumosVisiblesModal(insumosVisiblesModal + 1)}>+ Agregar</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {insumosModal.slice(0, insumosVisiblesModal).map((ins, idx) => (
                    <div key={idx} className="form-group" style={{ display: 'flex', alignItems: 'end', gap: '6px', margin: 0 }}>
                      <div style={{ flex: 1 }}>
                        <label>Insumo {idx + 1}</label>
                        <input placeholder={`Insumo ${idx + 1}`} value={ins.nombre}
                          onChange={e => {
                            const nuevos = [...insumosModal];
                            nuevos[idx].nombre = e.target.value;
                            setInsumosModal(nuevos);
                          }} />
                      </div>
                      <button type="button" className="delete-btn"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px', marginBottom: '2px' }}
                        onClick={() => {
                          const nuevas = insumosModal.filter((_, i) => i !== idx);
                          while (nuevas.length < 12) nuevas.push({ nombre: "" });
                          setInsumosModal(nuevas);
                          setInsumosVisiblesModal(Math.max(2, insumosVisiblesModal - 1));
                        }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '16px', background: '#F1F5F9', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--text)', marginBottom: '12px', fontSize: '15px' }}>Avería/Falla/Incidencia</h3>
                <div className="form-group" style={{ margin: 0 }}>
                  <textarea placeholder="Descripción de falla o incidencia..."
                    value={nuevoEquipoModal.averia}
                    onChange={e => setNuevoEquipoModal({...nuevoEquipoModal, averia: e.target.value})}
                    rows={3} style={{ minHeight: '80px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" className="cancel-btn" onClick={() => {
                  setMostrarModalEquipo(false);
                  setEquipoEditandoModal(null);
                }}>
                  <X size={18} /> Cancelar
                </button>
                <button type="submit" className="main-btn">
                  <Save size={18} /> {equipoEditandoModal ? "Guardar Cambios" : "Guardar Equipo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;