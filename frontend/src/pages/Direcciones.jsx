import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/mantenedor.css";
import { MapPin } from "lucide-react";
import api from "../services/api";
import HeaderModulo from "../components/comunes/HeaderModulo";
import BarraFiltros from "../components/comunes/BarraFiltros";
import { upperInput } from "../utils/helpers";
import DireccionFormulario from "../components/direcciones/DireccionFormulario";
import DireccionTabla from "../components/direcciones/DireccionTabla";
import DireccionCard from "../components/direcciones/DireccionCard";
import useDireccionesListado from "../hooks/useDireccionesListado";

function Direcciones() {
  const navigate = useNavigate();
  const {
    direcciones, loading, recargar, totalPaginas, paginaActual, setPaginaActual, filtroDireccion, setFiltroDireccion
  } = useDireccionesListado();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [direccionEditando, setDireccionEditando] = useState(null);
  const [soloLectura, setSoloLectura] = useState(false);

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
      try {
        await api.delete(`/api/direcciones/${id}`);
      } catch (err) {
        // Vinculada a clientes: se muestra cuáles y se pide confirmar antes de quitársela a todos
        if (err.response?.status !== 409) throw err;
        const lista = err.response.data.clientes.map((c) => `• ${c.codigo} ${c.razon_social}`).join("\n");
        if (!window.confirm(`Esta dirección está vinculada a ${err.response.data.clientes.length} cliente(s):\n\n${lista}\n\nSi la eliminas, desaparece de todos ellos. ¿Eliminar de todos modos?`)) return;
        await api.delete(`/api/direcciones/${id}?forzar=1`);
      }
      recargar();
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
        recargar();
      } else {
        setMostrarFormulario(false);
        setDireccionEditando(null);
        setSoloLectura(false);
        navigate('/direcciones', { replace: true });
        recargar();
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
      <HeaderModulo titulo="Mantenedor de Direcciones" Icono={MapPin} />

      <BarraFiltros
        acciones={[{ texto: "Nueva Dirección", onClick: nuevaDireccion }]}
        campos={[{ valor: filtroDireccion, onChange: setFiltroDireccion, placeholder: "Dirección", transformar: upperInput }]}
        onLimpiar={() => { setFiltroDireccion(""); }}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onPageChange={setPaginaActual}
      />

      {loading ? (
        <div className="empty-state">
          <MapPin size={48} />
          <p>Cargando direcciones...</p>
        </div>
      ) : (
        <>
          <DireccionTabla
            direcciones={direcciones}
            onVer={verDireccion}
            onEditar={editarDireccion}
            onEliminar={eliminarDireccion}
          />

          <div className="cards-table">
            {direcciones.map((d) => (
              <DireccionCard key={d.id} direccion={d} onVer={verDireccion} onEditar={editarDireccion} onEliminar={eliminarDireccion} />
            ))}
          </div>

          {!loading && direcciones.length === 0 && (
            <div className="empty-state">
              <MapPin size={48} />
              <p>No hay direcciones que coincidan con la búsqueda</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Direcciones;
