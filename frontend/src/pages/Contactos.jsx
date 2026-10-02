import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Contact, Plus } from "lucide-react";
import api from "../services/api";
import { getCached } from "../services/cache";
import '../styles/Contactos.css';
import { cerrarSesion } from "../utils/helpers";
import HeaderContacto from "../components/contactos/HeaderContacto";
import FiltrosContacto from "../components/contactos/FiltrosContacto";
import ContactoFormulario from "../components/contactos/ContactoFormulario";
import ContactoTabla from "../components/contactos/ContactoTabla";
import ContactoCard from "../components/contactos/ContactoCard";
import Pagination from "../components/Pagination";
import { usePaginaPersistente, useClampPagina } from "../hooks/usePaginacion";

function Contactos() {
  const navigate = useNavigate();
  const [contactos, setContactos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [contactoEditando, setContactoEditando] = useState(null);
  const [filtroNombre, setFiltroNombre] = useState("");
  const [paginaActual, setPaginaActual] = usePaginaPersistente("pagContactos", [filtroNombre]);
  const contactosPorPagina = 4;
  const [soloLectura, setSoloLectura] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchContactos = async (signal) => {
    setLoading(true);
    try {
      const res = await getCached("/api/contactos", { signal });
      setContactos(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchContactos(controller.signal);
    return () => controller.abort();
  }, []);

  const contactosFiltrados = contactos.filter(c => {
    if (filtroNombre) {
      const m = filtroNombre.toLowerCase();
      if (!c.nombre?.toLowerCase().includes(m)) return false;
    }
    return true;
  });

  const totalPaginas = Math.ceil(contactosFiltrados.length / contactosPorPagina);
  useClampPagina(paginaActual, setPaginaActual, totalPaginas);
  const indiceInicio = (paginaActual - 1) * contactosPorPagina;
  const contactosPagina = contactosFiltrados.slice(indiceInicio, indiceInicio + contactosPorPagina);

  const editarContacto = (c) => {
    setContactoEditando(c);
    setSoloLectura(false);
    setMostrarFormulario(true);
  };

  const verContacto = (c) => {
    setContactoEditando(c);
    setSoloLectura(true);
    setMostrarFormulario(true);
  };

  const nuevoContacto = () => {
    setContactoEditando(null);
    setSoloLectura(false);
    setMostrarFormulario(true);
  };

  const eliminarContacto = async (id) => {
    if (!window.confirm("¿Eliminar este contacto?")) return;
    try {
      await api.delete(`/api/contactos/${id}`);
      fetchContactos();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const guardarContacto = async (payload, id, mantener = false) => {
    try {
      if (id) {
        await api.put(`/api/contactos/${id}`, payload);
      } else {
        await api.post("/api/contactos", payload);
      }
      if (mantener && id) {
        const res = await api.get(`/api/contactos/${id}`);
        setContactoEditando(res.data);
        const lista = await getCached("/api/contactos");
        setContactos(lista.data);
      } else {
        setMostrarFormulario(false);
        setContactoEditando(null);
        setSoloLectura(false);
        navigate('/contactos', { replace: true });
        const res = await getCached("/api/contactos");
        setContactos(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.msg;
      alert(msg || "Error al guardar");
    }
  };

  if (mostrarFormulario) {
    return (
      <div className="container">
        <ContactoFormulario
          contactoEditando={contactoEditando}
          contactos={contactos}
          onCancel={() => {
            setMostrarFormulario(false);
            setContactoEditando(null);
            setSoloLectura(false);
            navigate('/contactos', { replace: true });
          }}
          onSave={guardarContacto}
          readOnly={soloLectura}
        />
      </div>
    );
  }

  return (
    <div className="container">
      <HeaderContacto navigate={navigate} onLogout={cerrarSesion} />

      <FiltrosContacto
        filtroNombre={filtroNombre}
        onFiltroNombreChange={setFiltroNombre}
        onLimpiar={() => { setFiltroNombre(""); }}
      />

      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
        <button className="main-btn" onClick={nuevoContacto}>
          <Plus size={16} /> Nuevo Contacto
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <Contact size={48} />
          <p>Cargando contactos...</p>
        </div>
      ) : (
        <>
          <ContactoTabla
            contactos={contactosPagina}
            onVer={verContacto}
            onEditar={editarContacto}
            onEliminar={eliminarContacto}
          />

          <div className="cards-table">
            {contactosPagina.map((c) => (
              <ContactoCard key={c.id} contacto={c} onVer={verContacto} onEditar={editarContacto} onEliminar={eliminarContacto} />
            ))}
          </div>

          {contactosFiltrados.length === 0 && (
            <div className="empty-state">
              <Contact size={48} />
              <p>No hay contactos que coincidan con la búsqueda</p>
            </div>
          )}

          <Pagination currentPage={paginaActual} totalPages={totalPaginas} onPageChange={setPaginaActual} />
        </>
      )}
    </div>
  );
}

export default Contactos;
