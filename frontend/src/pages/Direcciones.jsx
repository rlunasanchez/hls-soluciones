import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus } from "lucide-react";
import api from "../services/api";
import { getCached } from "../services/cache";
import '../styles/Direcciones.css';
import { cerrarSesion } from "../utils/helpers";
import HeaderDireccion from "../components/direcciones/HeaderDireccion";
import FiltrosDireccion from "../components/direcciones/FiltrosDireccion";
import DireccionFormulario from "../components/direcciones/DireccionFormulario";
import DireccionTabla from "../components/direcciones/DireccionTabla";
import DireccionCard from "../components/direcciones/DireccionCard";
import Pagination from "../components/Pagination";
import { usePaginaPersistente, useClampPagina } from "../hooks/usePaginacion";

function Direcciones() {
  const navigate = useNavigate();
  const [direcciones, setDirecciones] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [direccionEditando, setDireccionEditando] = useState(null);
  const [filtroDireccion, setFiltroDireccion] = useState("");
  const [paginaActual, setPaginaActual] = usePaginaPersistente("pagDirecciones", [filtroDireccion]);
  const direccionesPorPagina = 4;
  const [soloLectura, setSoloLectura] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchDirecciones = async (signal) => {
    setLoading(true);
    try {
      const res = await getCached("/api/direcciones", { signal });
      setDirecciones(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchDirecciones(controller.signal);
    return () => controller.abort();
  }, []);

  const direccionesFiltradas = direcciones.filter(d => {
    if (filtroDireccion) {
      const m = filtroDireccion.toLowerCase();
      if (!d.direccion?.toLowerCase().includes(m)) return false;
    }
    return true;
  });

  const totalPaginas = Math.ceil(direccionesFiltradas.length / direccionesPorPagina);
  useClampPagina(paginaActual, setPaginaActual, totalPaginas);
  const indiceInicio = (paginaActual - 1) * direccionesPorPagina;
  const direccionesPagina = direccionesFiltradas.slice(indiceInicio, indiceInicio + direccionesPorPagina);

  const editarDireccion = (d) => {
    setDireccionEditando(d);
    setSoloLectura(false);
    setMostrarFormulario(true);
  };

  const verDireccion = (d) => {
    setDireccionEditando(d);
    setSoloLectura(true);
    setMostrarFormulario(true);
  };

  const nuevaDireccion = () => {
    setDireccionEditando(null);
    setSoloLectura(false);
    setMostrarFormulario(true);
  };

  const eliminarDireccion = async (id) => {
    if (!window.confirm("¿Eliminar esta dirección?")) return;
    try {
      await api.delete(`/api/direcciones/${id}`);
      fetchDirecciones();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const guardarDireccion = async (payload, id, mantener = false) => {
    try {
      if (id) {
        await api.put(`/api/direcciones/${id}`, payload);
      } else {
        await api.post("/api/direcciones", payload);
      }
      if (mantener && id) {
        const res = await api.get(`/api/direcciones/${id}`);
        setDireccionEditando(res.data);
        const lista = await getCached("/api/direcciones");
        setDirecciones(lista.data);
      } else {
        setMostrarFormulario(false);
        setDireccionEditando(null);
        setSoloLectura(false);
        navigate('/direcciones', { replace: true });
        const res = await getCached("/api/direcciones");
        setDirecciones(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.msg;
      alert(msg || "Error al guardar");
    }
  };

  if (mostrarFormulario) {
    return (
      <div className="container">
        <DireccionFormulario
          direccionEditando={direccionEditando}
          direcciones={direcciones}
          onCancel={() => {
            setMostrarFormulario(false);
            setDireccionEditando(null);
            setSoloLectura(false);
            navigate('/direcciones', { replace: true });
          }}
          onSave={guardarDireccion}
          readOnly={soloLectura}
        />
      </div>
    );
  }

  return (
    <div className="container">
      <HeaderDireccion navigate={navigate} onLogout={cerrarSesion} />

      <FiltrosDireccion
        filtroDireccion={filtroDireccion}
        onFiltroDireccionChange={setFiltroDireccion}
        onLimpiar={() => { setFiltroDireccion(""); }}
      />

      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
        <button className="main-btn" onClick={nuevaDireccion}>
          <Plus size={16} /> Nueva Dirección
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <MapPin size={48} />
          <p>Cargando direcciones...</p>
        </div>
      ) : (
        <>
          <DireccionTabla
            direcciones={direccionesPagina}
            onVer={verDireccion}
            onEditar={editarDireccion}
            onEliminar={eliminarDireccion}
          />

          <div className="cards-table">
            {direccionesPagina.map((d) => (
              <DireccionCard key={d.id} direccion={d} onVer={verDireccion} onEditar={editarDireccion} onEliminar={eliminarDireccion} />
            ))}
          </div>

          {direccionesFiltradas.length === 0 && (
            <div className="empty-state">
              <MapPin size={48} />
              <p>No hay direcciones que coincidan con la búsqueda</p>
            </div>
          )}

          <Pagination currentPage={paginaActual} totalPages={totalPaginas} onPageChange={setPaginaActual} />
        </>
      )}
    </div>
  );
}

export default Direcciones;
