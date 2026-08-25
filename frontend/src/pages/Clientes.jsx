import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus } from "lucide-react";
import api from "../services/api";
import { parseToken } from "../utils/helpers";
import "../styles/Clientes.css";
import "../styles/clientes-componentes.css";
import HeaderCliente from "../components/clientes/HeaderCliente";
import Pagination from "../components/Pagination";
import FiltrosCliente from "../components/clientes/FiltrosCliente";
import ClienteLista from "../components/clientes/ClienteLista";
import ClienteFormulario from "../components/clientes/ClienteFormulario";
import { usePaginaPersistente, useClampPagina } from "../hooks/usePaginacion";

function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRut, setFiltroRut] = useState("");
  const [paginaActual, setPaginaActual] = usePaginaPersistente("pagClientes", [busqueda, filtroRut]);
  const clientesPorPagina = 4;
  const [soloLectura, setSoloLectura] = useState(false);

  const { usuarioActual } = parseToken();

  const fetchClientes = async (signal) => {
    try {
      const res = await api.get("/api/clientes", { signal });
      setClientes(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar clientes:", err);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchClientes(controller.signal);
    return () => controller.abort();
  }, []);

  const clientesFiltrados = clientes.filter((c) => {
    const texto = busqueda.toLowerCase();
    const razon = (c.razon_social || "").toLowerCase();
    const matchBusqueda = !texto || razon.startsWith(texto) || razon.includes(" " + texto);
    // RUT comparado por dígitos (ignora puntos, guion y DV): "14900" encuentra "14.900.665-6"
    const digRut = (v) => (v || "").replace(/[^0-9]/g, "");
    const matchRut = !filtroRut || digRut(c.rut).startsWith(digRut(filtroRut));
    return matchBusqueda && matchRut;
  });

  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
  useClampPagina(paginaActual, setPaginaActual, totalPaginas);
  const indiceInicio = (paginaActual - 1) * clientesPorPagina;
  const clientesPagina = clientesFiltrados.slice(indiceInicio, indiceInicio + clientesPorPagina);

  const guardarCliente = async (clienteData, resetFormulario, mantener = false) => {
    try {
      let clienteId = clienteEditando?.id;
      if (clienteEditando) {
        await api.put(`/api/clientes/${clienteEditando.id}`, clienteData);
        alert("Cliente actualizado");
      } else {
        const res = await api.post("/api/clientes", clienteData);
        clienteId = res.data?.id;
        alert("Cliente creado");
      }
      if (mantener && clienteId) {
        // "Guardar Cambios": guarda y se mantiene en el form para seguir editando
        const res = await api.get(`/api/clientes/${clienteId}`);
        setClienteEditando(res.data);
        fetchClientes();
      } else {
        resetFormulario();
        setClienteEditando(null);
        setSoloLectura(false);
        setMostrarFormulario(false);
        fetchClientes();
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar");
    }
  };

  const editarCliente = (c) => {
    setClienteEditando(c);
    setSoloLectura(false);
    setMostrarFormulario(true);
  };

  const verCliente = (c) => {
    setClienteEditando(c);
    setSoloLectura(true);
    setMostrarFormulario(true);
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm("¿Eliminar este cliente?")) return;
    try {
      await api.delete(`/api/clientes/${id}`);
      fetchClientes();
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  if (mostrarFormulario) {
    return (
      <div className="container">
        <ClienteFormulario
          clienteEditando={clienteEditando}
          clientes={clientes}
          onSave={guardarCliente}
          onCancel={() => {
            setClienteEditando(null);
            setSoloLectura(false);
            setMostrarFormulario(false);
          }}
          readOnly={soloLectura}
        />
      </div>
    );
  }

  return (
    <div className="container">
      <HeaderCliente usuarioActual={usuarioActual} onLogout={() => { localStorage.removeItem("token"); navigate("/login"); }} />

      <FiltrosCliente
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        filtroRut={filtroRut}
        onFiltroRutChange={setFiltroRut}
        onLimpiar={() => { setBusqueda(""); setFiltroRut(""); }}
      />

      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
        <button className="btn-nuevo-cliente" onClick={() => { setClienteEditando(null); setSoloLectura(false); setMostrarFormulario(true); }}>
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <ClienteLista
        clientes={clientesPagina}
        onNuevaOT={(c) => navigate("/orden-trabajo", { state: { cliente: c } })}
        onCotizacion={(c) => navigate("/cotizaciones", { state: { cliente: c } })}
        onVer={verCliente}
        onEditar={editarCliente}
        onEliminar={eliminarCliente}
      />

      {clientesFiltrados.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <p>No hay clientes que coincidan con la búsqueda</p>
        </div>
      )}

      <Pagination currentPage={paginaActual} totalPages={totalPaginas} onPageChange={setPaginaActual} />
    </div>
  );
}

export default Clientes;
