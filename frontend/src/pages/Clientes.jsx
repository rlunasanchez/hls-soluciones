import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus } from "lucide-react";
import api from "../services/api";
import { parseToken } from "../utils/helpers";
import "./Clientes.css";
import "../components/clientes/clientes-componentes.css";
import HeaderCliente from "../components/clientes/HeaderCliente";
import Pagination from "../components/Pagination";
import FiltrosCliente from "../components/clientes/FiltrosCliente";
import ClienteLista from "../components/clientes/ClienteLista";
import ClienteExpandido from "../components/clientes/ClienteExpandido";
import ClienteFormulario from "../components/clientes/ClienteFormulario";
import ModalReasignarEquipos from "../components/clientes/ModalReasignarEquipos";

function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRut, setFiltroRut] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const clientesPorPagina = 4;
  const [ordenesCliente, setOrdenesCliente] = useState([]);
  const [modalReasignar, setModalReasignar] = useState(null);

  const ordenesPorCliente = {};
  ordenesCliente.forEach((ot) => {
    if (!ordenesPorCliente[ot.cliente_id]) ordenesPorCliente[ot.cliente_id] = [];
    ordenesPorCliente[ot.cliente_id].push(ot);
  });

  const { usuarioActual } = parseToken();

  const fetchClientes = async () => {
    try {
      const res = await api.get("/api/clientes");
      setClientes(res.data);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    }
  };

  const fetchOrdenes = async () => {
    try {
      const res = await api.get("/api/ordenes?page=1&limit=10000");
      setOrdenesCliente(res.data.ordenes || []);
    } catch (err) {
      console.error("Error al cargar órdenes:", err);
    }
  };

  const eliminarOrdenCliente = async (id) => {
    if (!window.confirm("¿Eliminar esta orden de trabajo?")) return;
    try {
      await api.delete(`/api/ordenes/${id}`);
      fetchOrdenes();
    } catch (err) {
      alert("Error al eliminar orden");
    }
  };

  useEffect(() => {
    fetchClientes();
    fetchOrdenes();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroRut]);

  const clientesFiltrados = clientes.filter((c) => {
    const texto = busqueda.toLowerCase();
    const razon = (c.razon_social || "").toLowerCase();
    const matchBusqueda = !texto || razon.startsWith(texto) || razon.includes(" " + texto);
    const matchRut = !filtroRut || (c.rut || "").toLowerCase().startsWith(filtroRut.toLowerCase());
    return matchBusqueda && matchRut;
  });

  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
  const indiceInicio = (paginaActual - 1) * clientesPorPagina;
  const clientesPagina = clientesFiltrados.slice(indiceInicio, indiceInicio + clientesPorPagina);

  const guardarCliente = async (clienteData, resetFormulario) => {
    try {
      if (clienteEditando) {
        await api.put(`/api/clientes/${clienteEditando.id}`, clienteData);
        alert("Cliente actualizado");
      } else {
        await api.post("/api/clientes", clienteData);
        alert("Cliente creado");
      }
      resetFormulario();
      setClienteEditando(null);
      setMostrarFormulario(false);
      fetchClientes();
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar");
    }
  };

  const editarCliente = (c) => {
    setClienteEditando(c);
    setMostrarFormulario(true);
  };

  const eliminarCliente = async (id) => {
    try {
      const res = await api.get(`/api/clientes/${id}/equipos`);
      if (res.data.length > 0) {
        setModalReasignar({ clienteId: id, equipos: res.data });
      } else {
        if (!window.confirm("¿Eliminar este cliente?")) return;
        await api.delete(`/api/clientes/${id}`);
        fetchClientes();
      }
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  const confirmarReasignacion = async () => {
    const { clienteId } = modalReasignar;
    try {
      await api.delete(`/api/clientes/${clienteId}`);
      setModalReasignar(null);
      fetchClientes();
    } catch (err) {
      alert("Error al eliminar cliente");
    }
  };

  if (mostrarFormulario) {
    return (
      <div className="container">
        <ClienteFormulario
          clienteEditando={clienteEditando}
          clientes={clientes}
          onSave={guardarCliente}
          onCancel={() => { setClienteEditando(null); setMostrarFormulario(false); }}
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
        <button className="btn-nuevo-cliente" onClick={() => { setClienteEditando(null); setMostrarFormulario(true); }}>
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      {(busqueda || filtroRut) && clientesPagina.length > 0 && (
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 24 }}>
          {clientesPagina.map((c) => (
            <ClienteExpandido
              key={c.id}
              cliente={c}
              ordenes={ordenesPorCliente[c.id] || []}
              onEliminar={eliminarCliente}
              onEditar={() => editarCliente(c)}
              onEliminarOT={eliminarOrdenCliente}
            />
          ))}
        </div>
      )}

      {!busqueda && !filtroRut && (
        <ClienteLista
          clientes={clientesPagina}
          onNuevaOT={(c) => navigate("/orden-trabajo", { state: { cliente: c } })}
          onCotizacion={(c) => navigate("/cotizaciones", { state: { cliente: c } })}
          onEditar={editarCliente}
          onEliminar={eliminarCliente}
        />
      )}

      {clientesFiltrados.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <p>No hay clientes que coincidan con la búsqueda</p>
        </div>
      )}

      <Pagination currentPage={paginaActual} totalPages={totalPaginas} onPageChange={setPaginaActual} />

      {modalReasignar && (
        <ModalReasignarEquipos
          equipos={modalReasignar.equipos}
          clientes={clientes}
          clienteId={modalReasignar.clienteId}
          onConfirm={confirmarReasignacion}
          onCancel={() => setModalReasignar(null)}
        />
      )}
    </div>
  );
}

export default Clientes;
