import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus, Save, Trash2, Edit, ArrowLeft, LogOut, Monitor, Printer, Scissors, Droplets, Search, ChevronDown, ChevronUp, Home as HomeIcon, Users, UserCog, X } from "lucide-react";
import api from "../services/api";

function Equipos() {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaMarca, setBusquedaMarca] = useState("");
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const equiposPorPagina = 5;
  
  const [nuevoEquipo, setNuevoEquipo] = useState({
    equipo: "",
    modelo: "",
    marca: "",
    serie: "",
    contador_pag: 0,
    nivel_tintas: "",
    insumo1: "",
    insumo2: "",
    insumo3: "",
    insumo4: "",
    insumo5: "",
    insumo6: "",
    insumo7: "",
    insumo8: "",
    insumo9: "",
    insumo10: "",
    insumo11: "",
    insumo12: "",
    averia: ""
  });

  const [insumos, setInsumos] = useState([
    { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
    { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
    { nombre: "" }, { nombre: "" }, { nombre: "" }
  ]);
  const [insumosVisibles, setInsumosVisibles] = useState(2);

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

  const fetchEquipos = async () => {
    try {
      const res = await api.get("/api/equipos");
      setEquipos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const equiposFiltrados = equipos.filter(eq => {
    const textoBusqueda = busqueda.toLowerCase();
    const textoMarca = busquedaMarca.toLowerCase();
    return (
      (!textoBusqueda || eq.modelo?.toLowerCase().includes(textoBusqueda)) &&
      (!textoMarca || eq.marca?.toLowerCase().includes(textoMarca))
    );
  });

  const totalPaginas = Math.ceil(equiposFiltrados.length / equiposPorPagina);
  const indiceInicio = (paginaActual - 1) * equiposPorPagina;
  const equiposPagina = equiposFiltrados.slice(indiceInicio, indiceInicio + equiposPorPagina);

  useEffect(() => {
    fetchEquipos();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, busquedaMarca]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setBusquedaMarca("");
  };

  const actualizarInsumo = (idx, valor) => {
    const nuevos = [...insumos];
    nuevos[idx].nombre = valor;
    setInsumos(nuevos);
  };

  const guardarEquipo = async (e) => {
    e.preventDefault();
    const ins = insumos.filter(i => i.nombre.trim() !== "").map(i => i.nombre);
    const payload = {
      ...nuevoEquipo,
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
      insumo12: ins[11] || ""
    };
    try {
      if (equipoEditando) {
        await api.put(`/api/equipos/${equipoEditando.id}`, payload);
      } else {
        await api.post("/api/equipos", payload);
      }
      setNuevoEquipo({ equipo: "", modelo: "", marca: "", serie: "", contador_pag: 0, nivel_tintas: "", insumo1: "", insumo2: "", insumo3: "", insumo4: "", insumo5: "", insumo6: "", insumo7: "", insumo8: "", insumo9: "", insumo10: "", insumo11: "", insumo12: "", averia: "" });
      setInsumos([
        { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
        { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
        { nombre: "" }, { nombre: "" }, { nombre: "" }
      ]);
      setInsumosVisibles(2);
      setMostrarFormulario(false);
      setEquipoEditando(null);
      fetchEquipos();
    } catch (err) {
      alert("Error al guardar");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const editarEquipo = (eq) => {
    setEquipoEditando(eq);
    const arr = [
      { nombre: eq.insumo1 || "" }, { nombre: eq.insumo2 || "" }, { nombre: eq.insumo3 || "" },
      { nombre: eq.insumo4 || "" }, { nombre: eq.insumo5 || "" }, { nombre: eq.insumo6 || "" },
      { nombre: eq.insumo7 || "" }, { nombre: eq.insumo8 || "" }, { nombre: eq.insumo9 || "" },
      { nombre: eq.insumo10 || "" }, { nombre: eq.insumo11 || "" }, { nombre: eq.insumo12 || "" }
    ];
    while (arr.length < 12) arr.push({ nombre: "" });
    setInsumos(arr);
    setInsumosVisibles(arr.filter(i => i.nombre).length || 2);
    setNuevoEquipo({
      equipo: eq.equipo,
      modelo: eq.modelo,
      marca: eq.marca,
      serie: eq.serie || "",
      contador_pag: eq.contador_pag || 0,
      nivel_tintas: eq.nivel_tintas || "",
      insumo1: eq.insumo1 || "",
      insumo2: eq.insumo2 || "",
      insumo3: eq.insumo3 || "",
      insumo4: eq.insumo4 || "",
      insumo5: eq.insumo5 || "",
      insumo6: eq.insumo6 || "",
      insumo7: eq.insumo7 || "",
      insumo8: eq.insumo8 || "",
      insumo9: eq.insumo9 || "",
      insumo10: eq.insumo10 || "",
      insumo11: eq.insumo11 || "",
      insumo12: eq.insumo12 || "",
      averia: eq.averia || ""
    });
    setMostrarFormulario(true);
  };

  const eliminarEquipo = async (id) => {
    if (!window.confirm("¿Eliminar este equipo?")) return;
    try {
      await api.delete(`/api/equipos/${id}`);
      fetchEquipos();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const getIcono = (equipo) => {
    const eq = equipo?.toLowerCase() || "";
    if (eq.includes('impresora')) return <Printer size={24} />;
    if (eq.includes('scanner')) return <Monitor size={24} />;
    if (eq.includes('lector')) return <Scissors size={24} />;
    return <Package size={24} />;
  };

if (mostrarFormulario) {
    return (
      <div className="container">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--gradient)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <Package size={28} />
                {equipoEditando ? "Editar Equipo" : "Nuevo Equipo"}
              </h2>
              <button 
                type="button" 
                onClick={() => {
                  setMostrarFormulario(false);
                  setEquipoEditando(null);
                  setNuevoEquipo({ equipo: "", modelo: "", marca: "", serie: "", contador_pag: 0, nivel_tintas: "", insumo1: "", insumo2: "", insumo3: "", insumo4: "", insumo5: "", insumo6: "", insumo7: "", insumo8: "", insumo9: "", insumo10: "", insumo11: "", insumo12: "", averia: "" });
                  setMostrarExtras(false);
                  setMostrarExtrasEditar(false);
                }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', color: 'white' }}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={guardarEquipo} style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div style={{ gridColumn: 'span 2', padding: '20px', background: 'var(--primary-light)', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '16px' }}>Información del Equipo</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div className="form-group">
                    <label>Equipo</label>
                    <input
                      placeholder="Nombre del equipo"
                      value={nuevoEquipo.equipo}
                      onChange={(e) => setNuevoEquipo({...nuevoEquipo, equipo: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Marca</label>
                    <input
                      placeholder="Marca"
                      value={nuevoEquipo.marca}
                      onChange={(e) => setNuevoEquipo({...nuevoEquipo, marca: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Modelo</label>
                    <input
                      placeholder="Modelo"
                      value={nuevoEquipo.modelo}
                      onChange={(e) => setNuevoEquipo({...nuevoEquipo, modelo: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
                  <div className="form-group">
                    <label>Serie</label>
                    <input
                      placeholder="Número de serie"
                      value={nuevoEquipo.serie}
                      onChange={(e) => setNuevoEquipo({...nuevoEquipo, serie: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Contador Páginas</label>
                    <input
                      type="number"
                      placeholder="Contador"
                      value={nuevoEquipo.contador_pag}
                      onChange={(e) => setNuevoEquipo({...nuevoEquipo, contador_pag: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nivel Tintas</label>
                    <input
                      placeholder="Nivel de tintas"
                      value={nuevoEquipo.nivel_tintas}
                      onChange={(e) => setNuevoEquipo({...nuevoEquipo, nivel_tintas: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div style={{ gridColumn: 'span 2', padding: '20px', background: 'var(--success-light)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ color: 'var(--success)', margin: 0, fontSize: '16px' }}>Insumos</h3>
                  {insumosVisibles < 12 && (
                    <button 
                      type="button" 
                      className="secondary-btn"
                      style={{ padding: '8px 16px' }}
                      onClick={() => setInsumosVisibles(insumosVisibles + 1)}
                    >
                      + Agregar
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {insumos.slice(0, insumosVisibles).map((ins, idx) => (
                    <div key={idx} className="form-group" style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <label>Insumo {idx + 1}</label>
                        <input
                          placeholder={`Insumo ${idx + 1}`}
                          value={ins.nombre}
                          onChange={(e) => actualizarInsumo(idx, e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="delete-btn"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '38px', marginBottom: '2px' }}
                        onClick={() => {
                          const nuevas = insumos.filter((_, i) => i !== idx);
                          while (nuevas.length < 12) {
                            nuevas.push({ nombre: "" });
                          }
                          setInsumos(nuevas);
                          setInsumosVisibles(Math.max(2, insumosVisibles - 1));
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2', padding: '20px', background: '#F1F5F9', borderRadius: '12px' }}>
                <h3 style={{ color: 'var(--text)', marginBottom: '16px', fontSize: '16px' }}>Avería/Falla/Incidencia</h3>
                <div className="form-group">
                  <textarea
                    placeholder="Descripción de falla o incidencia..."
                    value={nuevoEquipo.averia}
                    onChange={(e) => setNuevoEquipo({...nuevoEquipo, averia: e.target.value})}
                    rows={3}
                    style={{ minHeight: '100px' }}
                  />
                </div>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="cancel-btn" onClick={() => {
                  setMostrarFormulario(false);
                  setEquipoEditando(null);
                  setNuevoEquipo({ equipo: "", modelo: "", marca: "", serie: "", contador_pag: 0, nivel_tintas: "", insumo1: "", insumo2: "", insumo3: "", insumo4: "", insumo5: "", insumo6: "", insumo7: "", insumo8: "", insumo9: "", insumo10: "", insumo11: "", insumo12: "", averia: "" });
                  setInsumos([
                    { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
                    { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" }, { nombre: "" },
                    { nombre: "" }, { nombre: "" }, { nombre: "" }
                  ]);
                  setInsumosVisibles(2);
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
      <div className="header" style={{ background: 'var(--gradient)', padding: '20px 32px' }}>
        <div className="header-left">
          <h1 style={{ color: 'white' }}><Package size={28} /> Mantenedor de Equipos</h1>
        </div>
        <div className="user-info" style={{ gap: '10px' }}>
          <button onClick={() => navigate("/home")} className="logout-btn" style={{ background: 'var(--primary)', color: 'white' }}>
            <HomeIcon size={18} />
            Inicio
          </button>
          <button onClick={() => navigate("/clientes")} className="logout-btn" style={{ background: 'var(--warning)', color: 'white' }}>
            <Users size={18} />
            Clientes
          </button>
          <button onClick={() => navigate("/usuarios")} className="logout-btn" style={{ background: '#0D9488', color: 'white' }}>
            <UserCog size={18} />
            Usuarios
          </button>
          <button onClick={cerrarSesion} className="logout-btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-header" onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}>
          <h3><Search size={18} /> Filtros de Búsqueda</h3>
          <div className="filters-toggle">
            {filtrosExpandidos ? 'Ocultar' : 'Mostrar'}
            {filtrosExpandidos ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        {filtrosExpandidos && (
          <div className="filters-content">
            <div className="filter-group">
              <label>Modelo</label>
              <input
                type="text"
                placeholder="Buscar modelo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Marca</label>
              <input
                type="text"
                placeholder="Buscar marca..."
                value={busquedaMarca}
                onChange={(e) => setBusquedaMarca(e.target.value)}
              />
            </div>
            <div className="filter-group" style={{ paddingTop: '23px' }}>
              <button onClick={limpiarFiltros} className="clear-btn">
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="table-header">
        <button onClick={() => { setMostrarFormulario(true); setMostrarExtras(false); setMostrarExtrasEditar(false); }} className="main-btn">
          <Plus size={20} />
          Nuevo Equipo
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Equipo</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Serie</th>
              <th>Contador</th>
              <th>Tintas</th>
              <th>Insumo 1</th>
              <th>Insumo 2</th>
              <th>Avería</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {equiposPagina.map((eq) => (
              <tr key={eq.id}>
                <td data-label="Equipo">{eq.equipo}</td>
                <td data-label="Marca">{eq.marca}</td>
                <td data-label="Modelo">{eq.modelo}</td>
                <td data-label="Serie">{eq.serie}</td>
                <td data-label="Contador">{eq.contador_pag}</td>
                <td data-label="Tintas">{eq.nivel_tintas}</td>
                <td data-label="Insumo 1">{eq.insumo1}</td>
                <td data-label="Insumo 2">{eq.insumo2}</td>
                <td data-label="Avería" className="averia-cell">{eq.averia}</td>
                <td data-label="Acciones">
                  <div className="action-buttons">
                    <button className="table-btn edit-btn" onClick={() => editarEquipo(eq)}>
                      <Edit size={14} /> Editar
                    </button>
                    <button className="table-btn delete-btn" onClick={() => eliminarEquipo(eq.id)}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {equiposFiltrados.length === 0 && (
        <div className="empty-state">
          <Package size={48} />
          <p>No hay equipos que coincidan con la búsqueda</p>
        </div>
      )}

      {totalPaginas > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Mostrando {indiceInicio + 1}-{Math.min(indiceInicio + equiposPorPagina, equiposFiltrados.length)} de {equiposFiltrados.length} equipos
          </div>
          <div className="pagination-controls">
            <button
              className="page-btn-nav"
              onClick={() => setPaginaActual(paginaActual - 1)}
              disabled={paginaActual === 1}
            >
              ‹
            </button>
            <span className="page-numbers-desktop">
              {[...Array(totalPaginas)].map((_, i) => {
                const numero = i + 1;
                return (
                  <button
                    key={numero}
                    onClick={() => setPaginaActual(numero)}
                    className={paginaActual === numero ? 'active' : ''}
                  >
                    {numero}
                  </button>
                );
              })}
            </span>
            <button
              className="page-btn-nav"
              onClick={() => setPaginaActual(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Equipos;