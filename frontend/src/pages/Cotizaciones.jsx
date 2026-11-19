import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { invalidar } from "../services/cache";
import "../styles/OrdenTrabajo.css";
import "../styles/ordenes-componentes.css";
import HeaderCotizacion from "../components/cotizaciones/HeaderCotizacion";
import CotizacionLista from "../components/cotizaciones/CotizacionLista";
import CotizacionFormulario from "../components/cotizaciones/CotizacionFormulario";
import ModalOpcionesPDFCotizacion from "../components/cotizaciones/ModalOpcionesPDFCotizacion";
import useCotizacionesListado from "../hooks/useCotizacionesListado";
import useCotizacionFormulario from "../hooks/useCotizacionFormulario";
import useCotizacionDesdeNavegacion from "../hooks/useCotizacionDesdeNavegacion";

function Cotizaciones() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cotParaPDF, setCotParaPDF] = useState(null);

  const listado = useCotizacionesListado();
  const form = useCotizacionFormulario({
    navigate,
    // Una cotización nueva queda primera en el listado: se salta a la página 1 para verla.
    alGuardar: (eraNueva) => {
      if (eraNueva) listado.setPaginaActual(1);
      listado.fetchCotizaciones();
    }
  });
  useCotizacionDesdeNavegacion(location, form);

  const eliminarCotizacion = async (id) => {
    if (!confirm("¿Seguro que desea eliminar esta cotización?")) return;
    try {
      await api.delete(`/api/cotizaciones/${id}`);
      invalidar("/api/ordenes");
      listado.fetchCotizaciones();
    } catch (err) {
      console.error("Error al eliminar cotización:", err);
      alert("Error al eliminar la cotización");
    }
  };

  const generarPDFActual = async () => {
    if (!form.editingId) return;
    setCotParaPDF((await api.get(`/api/cotizaciones/${form.editingId}`)).data);
  };

  return (
    <div className="container" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <HeaderCotizacion navigate={navigate} />

      {!form.mostrarFormulario ? (
        <div className="ot-list-wrap">
          <CotizacionLista
            cotizaciones={listado.cotizaciones}
            loading={listado.loading}
            filtroFolio={listado.filtroFolio}
            onFiltroFolioChange={listado.setFiltroFolio}
            filtroCliente={listado.filtroCliente}
            onFiltroClienteChange={listado.setFiltroCliente}
            onLimpiar={listado.limpiarFiltros}
            onNueva={form.abrirNueva}
            paginaActual={listado.paginaActual}
            totalPaginas={listado.totalPaginas}
            onPageChange={listado.setPaginaActual}
            onVer={(cot) => form.cargarCotizacion(cot, true)}
            onEditar={(cot) => form.cargarCotizacion(cot, false)}
            onEliminar={eliminarCotizacion}
            onPDF={setCotParaPDF}
          />
        </div>
      ) : (
        <CotizacionFormulario form={form} onPDF={generarPDFActual} />
      )}

      {cotParaPDF && <ModalOpcionesPDFCotizacion cot={cotParaPDF} onClose={() => setCotParaPDF(null)} />}
    </div>
  );
}

export default Cotizaciones;
