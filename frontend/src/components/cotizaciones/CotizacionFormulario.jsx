import { X, Save, FileDown } from "lucide-react";
import OrdenFormCliente from "../ordenes/OrdenFormCliente";
import CotizacionFormEjecutivo from "./CotizacionFormEjecutivo";
import CotizacionFormItems from "./CotizacionFormItems";

// Formulario de la cotización (nueva, ver o editar). El cliente, el contacto y la dirección son los
// mismos componentes de la OT; `form` es lo que devuelve useCotizacionFormulario.
function CotizacionFormulario({ form, onPDF }) {
  const {
    cotizacion, setCotizacion, soloLectura, editingId, guardando,
    clienteSeleccionado, setClienteSeleccionado, clienteInactivo,
    busquedaCliente, setBusquedaCliente, mostrarDropdownClientes, setMostrarDropdownClientes,
    clienteDropdownRef, clientesFiltrados, seleccionarCliente,
    cerrarFormulario, guardarCotizacion
  } = form;

  const tituloOT = cotizacion.ordenId
    ? `· asociada a OT N° ${String(cotizacion.ordenNumero || "").split("-").pop() || "?"}`
    : "";

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "12px" }}>
      <div className="of-wrap">
        <form onSubmit={guardarCotizacion} className="of-form" noValidate>
          <div className="of-head">
            <h2>
              {soloLectura ? "Ver Cotización" : editingId ? "Editar Cotización" : "Nueva Cotización"}
              {tituloOT && (
                <span style={{ marginLeft: 8, fontWeight: 600, fontSize: "0.75rem", color: "#fff", background: "rgba(255,255,255,0.22)", padding: "2px 8px", borderRadius: 999 }}>
                  {tituloOT}
                </span>
              )}
            </h2>
            <button type="button" className="of-head-close" onClick={cerrarFormulario}><X size={18} /></button>
          </div>

          <div className="of-cols of-cols-cot">
            <div className="of-col-left" style={{ minWidth: 0 }}>
              <OrdenFormCliente
                busquedaCliente={busquedaCliente} setBusquedaCliente={setBusquedaCliente}
                mostrarDropdownClientes={mostrarDropdownClientes} setMostrarDropdownClientes={setMostrarDropdownClientes}
                clienteSeleccionado={clienteSeleccionado} setClienteSeleccionado={setClienteSeleccionado}
                clientesFiltrados={clientesFiltrados} clienteDropdownRef={clienteDropdownRef}
                seleccionarCliente={seleccionarCliente} clienteInactivo={clienteInactivo}
                nuevaOrden={cotizacion} setNuevaOrden={setCotizacion} readOnly={soloLectura}
              />
              <CotizacionFormEjecutivo cotizacion={cotizacion} setCotizacion={setCotizacion} soloLectura={soloLectura} />
            </div>
            <div className="of-col-right" style={{ minWidth: 0 }}>
              <CotizacionFormItems cotizacion={cotizacion} setCotizacion={setCotizacion} soloLectura={soloLectura} />
            </div>
          </div>

          <div className="of-sub">
            <button type="button" className="of-btn-c" onClick={cerrarFormulario}>
              <X size={16} /> {soloLectura ? "Cerrar" : "Cancelar"}
            </button>
            {!soloLectura && (
              <button type="button" className="of-btn-s" onClick={(e) => guardarCotizacion(e, true)} disabled={guardando}>
                <Save size={16} /> {guardando ? "Guardando..." : (editingId ? "Guardar Cambios" : "Guardar")}
              </button>
            )}
            {!soloLectura && (
              <button type="submit" className="of-btn-p" disabled={guardando}>
                <Save size={16} /> {guardando ? "Guardando..." : (editingId ? "Cerrar" : "Guardar Cotización")}
              </button>
            )}
            {editingId && (
              <button type="button" className="of-btn-c" onClick={onPDF}>
                <FileDown size={16} /> PDF
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CotizacionFormulario;
