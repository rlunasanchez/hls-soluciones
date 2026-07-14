import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Package } from "lucide-react";
import api from "../services/api";
import './Equipos.css';
import HeaderEquipo from "../components/equipos/HeaderEquipo";
import FiltrosEquipo from "../components/equipos/FiltrosEquipo";
import EquipoFormulario from "../components/equipos/EquipoFormulario";
import EquipoTabla from "../components/equipos/EquipoTabla";
import EquipoCard from "../components/equipos/EquipoCard";
import Pagination from "../components/Pagination";

function Equipos() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [equipos, setEquipos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const equiposPorPagina = 5;
  const [clientes, setClientes] = useState([]);
  const [equiposExpandidos, setEquiposExpandidos] = useState({});

  const fetchEquipos = async () => {
    try {
      const res = await api.get("/api/equipos");
      setEquipos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await api.get("/api/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEquipos();
    fetchClientes();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  useEffect(() => {
    const clienteId = params.get("clienteId");
    if (clienteId && equipos.length > 0) {
      const cliente = clientes.find(c => c.id == clienteId);
      if (cliente) {
        setBusqueda(cliente.razon_social);
      }
    }
  }, [equipos, clientes]);

  const equiposFiltrados = equipos.filter(eq => {
    const texto = busqueda.toLowerCase();
    return !texto ||
      eq.serie?.toLowerCase().includes(texto) ||
      eq.codigo?.toLowerCase().includes(texto) ||
      eq.cliente_nombre?.toLowerCase().includes(texto);
  });

  const totalPaginas = Math.ceil(equiposFiltrados.length / equiposPorPagina);
  const indiceInicio = (paginaActual - 1) * equiposPorPagina;
  const equiposPagina = equiposFiltrados.slice(indiceInicio, indiceInicio + equiposPorPagina);

  const editarEquipo = async (eq) => {
    await fetchClientes();
    setEquipoEditando(eq);
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

  const guardarEquipo = async (payload, id) => {
    try {
      if (id) {
        await api.put(`/api/equipos/${id}`, payload);
      } else {
        await api.post("/api/equipos", payload);
      }
      setMostrarFormulario(false);
      setEquipoEditando(null);
      navigate('/equipos', { replace: true });
      const res = await api.get("/api/equipos");
      setEquipos(res.data);
    } catch (err) {
      alert("Error al guardar");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (mostrarFormulario) {
    return (
      <EquipoFormulario
        equipoEditando={equipoEditando}
        equipos={equipos}
        clientes={clientes}
        onCancel={() => {
          setMostrarFormulario(false);
          setEquipoEditando(null);
          navigate('/equipos', { replace: true });
        }}
        onSave={guardarEquipo}
      />
    );
  }

  return (
    <div className="container">
      <HeaderEquipo navigate={navigate} onLogout={cerrarSesion} />

      <FiltrosEquipo
        busqueda={busqueda}
        onBusquedaChange={(v) => { setBusqueda(v); setPaginaActual(1); }}
        onLimpiar={() => { setBusqueda(""); setPaginaActual(1); }}
      />

      <EquipoTabla
        equipos={equiposPagina}
        busqueda={busqueda}
        equiposExpandidos={equiposExpandidos}
        setEquiposExpandidos={setEquiposExpandidos}
        onEditar={editarEquipo}
        onEliminar={eliminarEquipo}
      />

      <div className="cards-table">
        {equiposPagina.map((eq) => (
          <EquipoCard key={eq.id} equipo={eq} onEditar={editarEquipo} onEliminar={eliminarEquipo} />
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
