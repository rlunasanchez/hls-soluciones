import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus } from "lucide-react";
import api from "../services/api";
import '../styles/Equipos.css';
import { cerrarSesion } from "../utils/helpers";
import HeaderEquipo from "../components/equipos/HeaderEquipo";
import FiltrosEquipo from "../components/equipos/FiltrosEquipo";
import EquipoFormulario from "../components/equipos/EquipoFormulario";
import EquipoTabla from "../components/equipos/EquipoTabla";
import EquipoCard from "../components/equipos/EquipoCard";
import Pagination from "../components/Pagination";

function Equipos() {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [filtroModelo, setFiltroModelo] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const equiposPorPagina = 4;
  const [soloLectura, setSoloLectura] = useState(false);

  const fetchEquipos = async (signal) => {
    try {
      const res = await api.get("/api/equipos", { signal });
      setEquipos(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") console.error(err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchEquipos(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroModelo]);

  const equiposFiltrados = equipos.filter(eq => {
    if (filtroModelo) {
      const m = filtroModelo.toLowerCase();
      if (!eq.modelo?.toLowerCase().includes(m)) return false;
    }
    return true;
  });

  const totalPaginas = Math.ceil(equiposFiltrados.length / equiposPorPagina);
  const indiceInicio = (paginaActual - 1) * equiposPorPagina;
  const equiposPagina = equiposFiltrados.slice(indiceInicio, indiceInicio + equiposPorPagina);

  const editarEquipo = (eq) => {
    setEquipoEditando(eq);
    setSoloLectura(false);
    setMostrarFormulario(true);
  };

  const verEquipo = (eq) => {
    setEquipoEditando(eq);
    setSoloLectura(true);
    setMostrarFormulario(true);
  };

  const nuevaEquipo = () => {
    setEquipoEditando(null);
    setSoloLectura(false);
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

  const guardarEquipo = async (payload, id, mantener = false) => {
    try {
      if (id) {
        await api.put(`/api/equipos/${id}`, payload);
      } else {
        await api.post("/api/equipos", payload);
      }
      if (mantener && id) {
        // "Guardar Cambios": guarda y se mantiene en el form para seguir editando
        const res = await api.get(`/api/equipos/${id}`);
        setEquipoEditando(res.data);
        const lista = await api.get("/api/equipos");
        setEquipos(lista.data);
      } else {
        setMostrarFormulario(false);
        setEquipoEditando(null);
        setSoloLectura(false);
        navigate('/equipos', { replace: true });
        const res = await api.get("/api/equipos");
        setEquipos(res.data);
      }
    } catch (err) {
      alert("Error al guardar");
    }
  };

  if (mostrarFormulario) {
    return (
      <div className="container">
      <EquipoFormulario
        equipoEditando={equipoEditando}
        equipos={equipos}
        onCancel={() => {
          setMostrarFormulario(false);
          setEquipoEditando(null);
          setSoloLectura(false);
          navigate('/equipos', { replace: true });
        }}
        onSave={guardarEquipo}
        readOnly={soloLectura}
      />
      </div>
    );
  }

  return (
    <div className="container">
      <HeaderEquipo navigate={navigate} onLogout={cerrarSesion} />

        <FiltrosEquipo
          filtroModelo={filtroModelo}
          onFiltroModeloChange={setFiltroModelo}
          onLimpiar={() => { setFiltroModelo(""); }}
        />

      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
        <button className="btn-nuevo-cliente" onClick={nuevaEquipo}>
          <Plus size={16} /> Nuevo Equipo
        </button>
      </div>

      <EquipoTabla
        equipos={equiposPagina}
        onVer={verEquipo}
        onEditar={editarEquipo}
        onEliminar={eliminarEquipo}
      />

      <div className="cards-table">
        {equiposPagina.map((eq) => (
          <EquipoCard key={eq.id} equipo={eq} onVer={verEquipo} onEditar={editarEquipo} onEliminar={eliminarEquipo} />
        ))}
      </div>

      {equiposFiltrados.length === 0 && (
        <div className="empty-state">
          <Package size={48} />
          <p>No hay equipos que coincidan con la búsqueda</p>
        </div>
      )}

      <Pagination currentPage={paginaActual} totalPages={totalPaginas} onPageChange={setPaginaActual} />
    </div>
  );
}

export default Equipos;
