import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import api from "../services/api";
import "../styles/Clientes.css";
import "../styles/clientes-componentes.css";
import HeaderModulo from "../components/comunes/HeaderModulo";
import BarraFiltros from "../components/comunes/BarraFiltros";
import { formatearRutInput } from "../utils/helpers";
import ClienteLista from "../components/clientes/ClienteLista";
import ClienteFormulario from "../components/clientes/ClienteFormulario";
import useClientesListado from "../hooks/useClientesListado";

function Clientes() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [soloLectura, setSoloLectura] = useState(false);

  // Listado: el servidor filtra por nombre y RUT y entrega una página de 4 clientes
  const {
    clientes: clientesPagina, loading, fetchClientes, totalPaginas, totalClientes, paginaActual, setPaginaActual,
    busqueda, setBusqueda, filtroRut, setFiltroRut
  } = useClientesListado();

  const guardarCliente = async (clienteData, resetFormulario, mantener = false) => {
    try {
      let clienteId = clienteEditando?.id;
      const esNuevo = !clienteEditando;
      if (clienteEditando) {
        await api.put(`/api/clientes/${clienteEditando.id}`, clienteData);
        alert("Cliente actualizado");
      } else {
        const res = await api.post("/api/clientes", clienteData);
        clienteId = res.data?.id;
        alert("Cliente creado");
      }
      // El listado va ordenado por id DESC: un cliente recién creado siempre
      // cae en la página 1. Si el usuario venía de otra página, sin este
      // reset el listado se refresca pero el cliente nuevo queda fuera de vista.
      if (esNuevo) setPaginaActual(1);
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
      <HeaderModulo titulo="Mantenedor de Clientes" Icono={Users} />

      <BarraFiltros
        acciones={[{ texto: "Nuevo Cliente", onClick: () => { setClienteEditando(null); setSoloLectura(false); setMostrarFormulario(true); } }]}
        campos={[
          { valor: busqueda, onChange: setBusqueda, placeholder: "Razón Social / Nombre" },
          { valor: filtroRut, onChange: setFiltroRut, placeholder: "RUT", transformar: (e) => formatearRutInput(e.target.value) }
        ]}
        onLimpiar={() => { setBusqueda(""); setFiltroRut(""); }}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onPageChange={setPaginaActual}
      />

      {loading ? (
        <div className="empty-state">
          <Users size={48} />
          <p>Cargando clientes...</p>
        </div>
      ) : (
        <>
          <ClienteLista
            clientes={clientesPagina}
            onNuevaOT={(c) => navigate("/orden-trabajo", { state: { cliente: c } })}
            onCotizacion={(c) => navigate("/cotizaciones", { state: { cliente: c } })}
            onVer={verCliente}
            onEditar={editarCliente}
            onEliminar={eliminarCliente}
          />

          {totalClientes === 0 && (
            <div className="empty-state">
              <Users size={48} />
              <p>No hay clientes que coincidan con la búsqueda</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Clientes;
