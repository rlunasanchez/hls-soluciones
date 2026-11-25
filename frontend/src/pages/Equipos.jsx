import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import api from "../services/api";
import '../styles/mantenedor.css';
import HeaderModulo from "../components/comunes/HeaderModulo";
import BarraFiltros from "../components/comunes/BarraFiltros";
import { upperInput } from "../utils/helpers";
import EquipoFormulario from "../components/equipos/EquipoFormulario";
import EquipoTabla from "../components/equipos/EquipoTabla";
import EquipoCard from "../components/equipos/EquipoCard";
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
      <HeaderModulo titulo="Mantenedor de Equipos" Icono={Package} />

      <BarraFiltros
        acciones={[{ texto: "Nuevo Equipo", onClick: nuevaEquipo }]}
        campos={[{ valor: filtroModelo, onChange: setFiltroModelo, placeholder: "Modelo", transformar: upperInput }]}
        onLimpiar={() => { setFiltroModelo(""); }}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onPageChange={setPaginaActual}
      />

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
        </>
      )}
    </div>
  );
}

export default Equipos;
