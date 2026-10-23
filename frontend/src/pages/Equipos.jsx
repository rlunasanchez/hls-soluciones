import { useState } from "react";
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
import useEquiposListado from "../hooks/useEquiposListado";

function Equipos() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [soloLectura, setSoloLectura] = useState(false);

  // Listado: el servidor filtra por modelo y entrega una página de 4 equipos
  const {
    equipos: equiposPagina, loading, fetchEquipos, totalPaginas, totalEquipos, paginaActual, setPaginaActual,
    filtroModelo, setFiltroModelo
  } = useEquiposListado();

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

  // Devuelve "rechazado" si el servidor no aceptó los datos (por ejemplo, equipo repetido) para que el
  // formulario vuelva a su estado anterior; "error" si falló por otra causa; "ok" si guardó.
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
        fetchEquipos();
      } else {
        setMostrarFormulario(false);
        setEquipoEditando(null);
        setSoloLectura(false);
        navigate('/equipos', { replace: true });
        fetchEquipos();
      }
      return "ok";
    } catch (err) {
      const msg = err.response?.data?.msg;
      alert(msg || "Error al guardar");
      return err.response?.status === 400 ? "rechazado" : "error";
    }
  };

  if (mostrarFormulario) {
    return (
      <div className="container">
      <EquipoFormulario
        equipoEditando={equipoEditando}
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
        <button className="main-btn" onClick={nuevaEquipo}>
          <Plus size={16} /> Nuevo Equipo
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <Package size={48} />
          <p>Cargando equipos...</p>
        </div>
      ) : (
        <>
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

          {totalEquipos === 0 && (
            <div className="empty-state">
              <Package size={48} />
              <p>No hay equipos que coincidan con la búsqueda</p>
            </div>
          )}

          <Pagination currentPage={paginaActual} totalPages={totalPaginas} onPageChange={setPaginaActual} />
        </>
      )}
    </div>
  );
}

export default Equipos;
