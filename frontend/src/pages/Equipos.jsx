import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus, Save, Trash2, Edit, ArrowLeft, LogOut, Monitor, Printer, Scissors, Droplets, Search, ChevronDown, ChevronUp } from "lucide-react";
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
    averia: ""
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

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const guardarEquipo = async (e) => {
    e.preventDefault();
    try {
      if (equipoEditando) {
        await api.put(`/api/equipos/${equipoEditando.id}`, nuevoEquipo);
        alert("Equipo actualizado");
      } else {
        await api.post("/api/equipos", nuevoEquipo);
        alert("Equipo creado");
      }
      setNuevoEquipo({ equipo: "", modelo: "", marca: "", serie: "", contador_pag: 0, nivel_tintas: "", insumo1: "", insumo2: "", averia: "" });
      setEquipoEditando(null);
      setMostrarFormulario(false);
      fetchEquipos();
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar");
    }
  };

  const editarEquipo = (eq) => {
    setEquipoEditando(eq);
    setNuevoEquipo({
      equipo: eq.equipo,
      modelo: eq.modelo,
      marca: eq.marca,
      serie: eq.serie || "",
      contador_pag: eq.contador_pag || 0,
      nivel_tintas: eq.nivel_tintas || "",
      insumo1: eq.insumo1 || "",
      insumo2: eq.insumo2 || "",
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
        <div className="form-container">
          <div className="form-header">
            <h2><Package size={24} /> {equipoEditando ? "Editar Equipo" : "Nuevo Equipo"}</h2>
          </div>
          <form onSubmit={guardarEquipo} className="form-grid">
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
              <label>Modelo</label>
              <input
                placeholder="Modelo"
                value={nuevoEquipo.modelo}
                onChange={(e) => setNuevoEquipo({...nuevoEquipo, modelo: e.target.value})}
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
                placeholder="Contador de páginas"
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
            <div className="form-group">
              <label>Insumo 1</label>
              <input
                placeholder="Insumo 1"
                value={nuevoEquipo.insumo1}
                onChange={(e) => setNuevoEquipo({...nuevoEquipo, insumo1: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Insumo 2</label>
              <input
                placeholder="Insumo 2"
                value={nuevoEquipo.insumo2}
                onChange={(e) => setNuevoEquipo({...nuevoEquipo, insumo2: e.target.value})}
              />
            </div>
            <div className="form-group full-width">
              <label>Avería/Falla/Incidencia</label>
              <textarea
                placeholder="Descripción de falla"
                value={nuevoEquipo.averia}
                onChange={(e) => setNuevoEquipo({...nuevoEquipo, averia: e.target.value})}
                rows={2}
              />
            </div>
            <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '20px', marginTop: '8px' }}>
              <button type="button" className="cancel-btn" onClick={() => {
                setMostrarFormulario(false);
                setEquipoEditando(null);
                setNuevoEquipo({ equipo: "", modelo: "", marca: "", serie: "", contador_pag: 0, nivel_tintas: "", insumo1: "", insumo2: "", averia: "" });
              }}>
                <ArrowLeft size={20} /> Cancelar
              </button>
              <button type="submit" className="main-btn">
                <Save size={20} /> Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div className="header-left">
          <h1><Package size={28} /> Mantenedor de Equipos</h1>
        </div>
        <div className="user-info">
          <div className="user-badge">{usuarioActual}</div>
          <button onClick={() => navigate("/usuarios")} className="logout-btn">
            <ArrowLeft size={18} />
            Usuarios
          </button>
          <button onClick={cerrarSesion} className="logout-btn">
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
        <button onClick={() => setMostrarFormulario(true)} className="main-btn">
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