import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Contact } from "lucide-react";
import api from "../services/api";
import '../styles/Contactos.css';
import { cerrarSesion } from "../utils/helpers";
import HeaderContacto from "../components/contactos/HeaderContacto";
import FiltrosContacto from "../components/contactos/FiltrosContacto";
import ContactoFormulario from "../components/contactos/ContactoFormulario";
import ContactoTabla from "../components/contactos/ContactoTabla";
import ContactoCard from "../components/contactos/ContactoCard";
import useContactosListado from "../hooks/useContactosListado";

function Contactos() {
  const navigate = useNavigate();
  const {
    contactos, loading, recargar, totalPaginas, paginaActual, setPaginaActual, filtroNombre, setFiltroNombre
  } = useContactosListado();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [contactoEditando, setContactoEditando] = useState(null);
  const [soloLectura, setSoloLectura] = useState(false);

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
      try {
        await api.delete(`/api/contactos/${id}`);
      } catch (err) {
        // Vinculado a clientes: se muestra cuáles y se pide confirmar antes de quitárselo a todos
        if (err.response?.status !== 409) throw err;
        const lista = err.response.data.clientes.map((c) => `• ${c.codigo} ${c.razon_social}`).join("\n");
        if (!window.confirm(`Este contacto está vinculado a ${err.response.data.clientes.length} cliente(s):\n\n${lista}\n\nSi lo eliminas, desaparece de todos ellos. ¿Eliminar de todos modos?`)) return;
        await api.delete(`/api/contactos/${id}?forzar=1`);
      }
      recargar();
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
        recargar();
      } else {
        setMostrarFormulario(false);
        setContactoEditando(null);
        setSoloLectura(false);
        navigate('/contactos', { replace: true });
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
        <ContactoFormulario
          contactoEditando={contactoEditando}
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
        onNuevo={nuevoContacto}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onPageChange={setPaginaActual}
      />

      {loading ? (
        <div className="empty-state">
          <Contact size={48} />
          <p>Cargando contactos...</p>
        </div>
      ) : (
        <>
          <ContactoTabla
            contactos={contactos}
            onVer={verContacto}
            onEditar={editarContacto}
            onEliminar={eliminarContacto}
          />

          <div className="cards-table">
            {contactos.map((c) => (
              <ContactoCard key={c.id} contacto={c} onVer={verContacto} onEditar={editarContacto} onEliminar={eliminarContacto} />
            ))}
          </div>

          {!loading && contactos.length === 0 && (
            <div className="empty-state">
              <Contact size={48} />
              <p>No hay contactos que coincidan con la búsqueda</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Contactos;
