import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import useBusquedaApi from "../hooks/useBusquedaApi";
import { clienteDeOrden } from "../utils/clientesApi";
import { verificarEquipo } from "../utils/equiposApi";
import { cerrarSesion } from "../utils/helpers";
import { ordenAFormulario, insumosDeOrden, ordenVacia, insumosVacios, ordenParaCliente, tecnicoDeSesion, datosAlElegirCliente } from "../utils/ordenFormato";
import '../styles/OrdenTrabajo.css';
import "../styles/ordenes-componentes.css";
import HeaderOrdenTrabajo from "../components/ordenes/HeaderOrdenTrabajo";
import OrdenLista from "../components/ordenes/OrdenLista";
import OrdenFormDatos from "../components/ordenes/OrdenFormDatos";
import OrdenFormCliente from "../components/ordenes/OrdenFormCliente";
import OrdenFormEquipo from "../components/ordenes/OrdenFormEquipo";
import OrdenFormInsumos from "../components/ordenes/OrdenFormInsumos";
import OrdenFormAveria from "../components/ordenes/OrdenFormAveria";
import ModalOpcionesPDF from "../components/ordenes/ModalOpcionesPDF";
import OrdenFormCabecera from "../components/ordenes/OrdenFormCabecera";
import OrdenCotizaciones from "../components/ordenes/OrdenCotizaciones";
import OrdenFormBotones from "../components/ordenes/OrdenFormBotones";
import OrdenFormObservaciones from "../components/ordenes/OrdenFormObservaciones";
import useCotizacionesDeOrden from "../hooks/useCotizacionesDeOrden";
import useEquiposOT from "../hooks/useEquiposOT";
import useClicFuera from "../hooks/useClicFuera";
import useOrdenDesdeNavegacion from "../hooks/useOrdenDesdeNavegacion";
import useGuardarOrden from "../hooks/useGuardarOrden";
import useAdjuntosOrden from "../hooks/useAdjuntosOrden";
import useOrdenesListado from "../hooks/useOrdenesListado";


function OrdenTrabajo() {
  const navigate = useNavigate();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Listado de órdenes: carga, filtros y paginación
  const {
    ordenes, loading, fetchOrdenes, ordenesPag, totalPaginas, paginaActual, setPaginaActual,
    filtroNumeroOrden, setFiltroNumeroOrden, filtroCliente, setFiltroCliente, filtroSerie, setFiltroSerie,
    filtroEstado, setFiltroEstado, filtroGarantia, setFiltroGarantia,
    filtroFechaDesde, setFiltroFechaDesde, filtroFechaHasta, setFiltroFechaHasta
  } = useOrdenesListado();
  const [editingId, setEditingId] = useState(null);

  // Id de la orden abierta en el formulario, tanto en modo Editar como en modo
  // Ver (a diferencia de editingId, que en modo Ver queda en null). Sirve para
  // consultar las cotizaciones asociadas sin importar el modo.
  const [ordenIdActual, setOrdenIdActual] = useState(null);
  const cotizacionesDeOrden = useCotizacionesDeOrden(ordenIdActual);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteFijo, setClienteFijo] = useState(false);
  const [equipoFijo, setEquipoFijo] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [clienteInactivo, setClienteInactivo] = useState(false);
  const [soloLectura, setSoloLectura] = useState(false);
  const [ordenParaPDF, setOrdenParaPDF] = useState(null);
  
  // Ref para detectar clics fuera del desplegable de clientes
  const clienteDropdownRef = useRef(null);
  
  // Insumos dinámicos (se muestran de a 2; hasta 12)
  const [insumos, setInsumos] = useState(insumosVacios);
  const [insumosVisibles, setInsumosVisibles] = useState(2);

  // Estado principal de la orden
  const [nuevaOrden, setNuevaOrden] = useState(() => ordenVacia(tecnicoDeSesion()));

  // Equipos: lista del mantenedor, buscador por modelo, elegir y registrar equipo
  const {
    equipoExistente, refrescarEquipo,
    busquedaModelo, setBusquedaModelo, mostrarDropdownModelo, setMostrarDropdownModelo,
    setEquiposModeloSugeridos, equiposModeloFiltrados, equipoModeloDropdownRef,
    seleccionarEquipoPorModelo, registrarEquipoEnMantenedor
  } = useEquiposOT({ nuevaOrden, setNuevaOrden });

  // Función para calcular siguiente número de OT correlativo
  const calcularSiguienteNumeroOrden = async () => {
    try {
      const res = await api.get("/api/ordenes/siguiente-numero");
      return res.data.numeroOrden;
    } catch (err) {
      const year = new Date().getFullYear();
      return `OT-${year}-0001`;
    }
  };

  // Función para abrir formulario de nueva orden con valores automáticos
  // Abre una OT nueva, en blanco o (clienteInicial) con los datos de un cliente que viene desde Clientes.
  const abrirNuevaOrden = async (clienteInicial = null) => {
    const numeroOt = await calcularSiguienteNumeroOrden();
    setNuevaOrden({
      ...ordenVacia(tecnicoDeSesion()),
      ...(clienteInicial ? ordenParaCliente(clienteInicial) : {}),
      numeroOrden: numeroOt,
      fecha: new Date().toISOString().split("T")[0]
    });
    setEditingId(null);
    setOrdenIdActual(null);
    setSoloLectura(false);
    setClienteSeleccionado(clienteInicial);
    setClienteFijo(false);
    setEquipoFijo(false);
    setClienteInactivo(false);
    setBusquedaCliente("");
    setBusquedaModelo("");
    setEquiposModeloSugeridos([]);
    setInsumos(insumosVacios());
    setInsumosVisibles(2);
    setMostrarFormulario(true);
  };

  // Si el cliente de la OT ya está seleccionado (porque se registró de nuevo o se eligió otro),
  // deja de estar "desactivado": se quita el aviso sin tener que salir y volver a entrar.
  useEffect(() => {
    if (clienteSeleccionado) setClienteInactivo(false);
  }, [clienteSeleccionado]);

  // Cierra el desplegable de clientes al hacer clic fuera
  useClicFuera(clienteDropdownRef, useCallback(() => setMostrarDropdownClientes(false), []));

  // Abre una orden guardada en el formulario. modo "editar" la deja editable; modo "ver", en solo lectura.
  // El listado no trae "adjunto" (es pesado): la orden completa se pide recién al abrirla.
  const cargarOrden = async (ordenListado, modo) => {
    const { data: orden } = await api.get(`/api/ordenes/${ordenListado.id}`);
    // ¿El equipo de la OT está en el mantenedor? Se comprueba antes de abrirla para que sus campos
    // aparezcan ya bloqueados (sin un instante editable).
    const equipoDelMantenedor = await verificarEquipo(orden);

    setSoloLectura(modo === "ver");
    setEditingId(modo === "editar" ? orden.id : null);
    setOrdenIdActual(orden.id);
    setClienteFijo(false);
    setEquipoFijo(false);
    setMostrarFormulario(true);

    // Los campos de la OT son una copia (snapshot): no se pisan con datos frescos del cliente/equipo
    setNuevaOrden(ordenAFormulario(orden));
    refrescarEquipo(equipoDelMantenedor);

    // Cliente asociado: solo para badge/estado. Se busca en el servidor por id o, si ese id ya no
    // existe (el cliente se borró y se registró de nuevo), por nombre.
    const { cliente: seleccionado, inactivo } = await clienteDeOrden(orden);
    setClienteSeleccionado(seleccionado);
    setClienteInactivo(inactivo);
    setBusquedaCliente("");

    const { insumos: lista, visibles } = insumosDeOrden(orden);
    setInsumos(lista);
    setInsumosVisibles(visibles);
  };

  const editarOrden = (orden) => cargarOrden(orden, "editar");
  const verOrden = (orden) => cargarOrden(orden, "ver");

  // Adjuntos de la orden abierta (archivos aparte de la OT; los antiguos se migran al abrirla en Editar)
  const adjuntos = useAdjuntosOrden({
    ordenId: ordenIdActual, activo: mostrarFormulario, soloLectura, antiguos: nuevaOrden.adjuntosAntiguos,
    alMigrar: () => setNuevaOrden((prev) => ({ ...prev, adjuntosAntiguos: [] }))
  });

  // Abrir lo que viene desde Clientes o Cotizaciones (orden a editar, volver a una OT, OT nueva de un cliente)
  useOrdenDesdeNavegacion({ setMostrarFormulario, setEditingId, editarOrden, verOrden, abrirNuevaOrden });

  const eliminarOrden = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar esta orden de trabajo?")) return;
    try {
      await api.delete(`/api/ordenes/${id}`);
      fetchOrdenes();
    } catch (err) {
      console.error("Error al eliminar orden:", err);
      alert("Error al eliminar la orden");
    }
  };

  // Seleccionar cliente y cargar sus datos (qué campos cambian: ver datosAlElegirCliente)
  const seleccionarCliente = (cliente) => {
    const mismoCliente = clienteSeleccionado?.id === cliente.id;
    setClienteSeleccionado(cliente);
    setClienteInactivo(false);
    setBusquedaCliente("");
    setMostrarDropdownClientes(false);
    // OT desde cero: además se limpia el equipo elegido
    if (!editingId) {
      setBusquedaModelo("");
    }
    setNuevaOrden(prev => ({ ...prev, ...datosAlElegirCliente(cliente, { editando: !!editingId, mismoCliente }) }));
  };

  // Buscador de cliente: consulta al servidor desde 2 caracteres (hasta 10 resultados, por nombre,
  // código o dígitos del RUT). null mientras responde.
  const [resultadosCliente] = useBusquedaApi("/api/clientes", busquedaCliente);
  const clientesFiltrados = busquedaCliente.length >= 2 ? resultadosCliente : [];

  // Guardar la orden, y generar su PDF o ir a crear una cotización
  const { guardando, guardarOrden, generarPDFOrdenActual, irACotizacionOrdenActual } = useGuardarOrden({
    nuevaOrden, insumos, clienteSeleccionado, editingId, setEditingId, editarOrden,
    abrirPDF: setOrdenParaPDF,
    subirAdjuntos: adjuntos.subirPendientes,
    irACotizacion: (orden) => navigate('/cotizaciones', { state: { orden } }),
    // Guardar (a diferencia de Cancelar/X) siempre deja en el mantenedor de OT, aunque se haya creado
    // desde Clientes — para eso está el listado de OT. Una orden nueva queda primera (el backend ordena
    // por id DESC): saltar a la página 1 para verla. Al editar se conserva la página del usuario.
    alTerminar: (eraOrdenNueva) => {
      setMostrarFormulario(false);
      resetFormulario();
      setSoloLectura(false);
      window.history.replaceState({}, document.title);
      if (eraOrdenNueva) setPaginaActual(1);
      fetchOrdenes();
    }
  });

  const resetFormulario = () => {
    setNuevaOrden(ordenVacia(tecnicoDeSesion()));
    setInsumos(insumosVacios());
    setInsumosVisibles(2);
    setClienteSeleccionado(null);
    setClienteFijo(false);
    setEquipoFijo(false);
    setBusquedaCliente("");
    setBusquedaModelo("");
    setEquiposModeloSugeridos([]);
    setMostrarDropdownModelo(false);
    setClienteInactivo(false);
    setEditingId(null);
  };

  // Cerrar el formulario (X o Cancelar/Cerrar): si no se viene de Clientes,
  // refresca la lista para reflejar los cambios guardados con "Guardar Cambios"
  const cerrarFormulario = () => {
    const navState = window.history.state?.usr;
    const vinoDeCliente = navState?.cliente || navState?.orden;
    setMostrarFormulario(false);
    resetFormulario();
    setEditingId(null);
    setOrdenIdActual(null);
    setSoloLectura(false);
    window.history.replaceState({}, document.title);
    if (vinoDeCliente) {
      navigate("/clientes");
    } else {
      fetchOrdenes();
    }
  };
  return (
    <div className="container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <HeaderOrdenTrabajo onLogout={cerrarSesion} />

      {!mostrarFormulario ? (
          <div className="ot-list-wrap">
          <OrdenLista
            ordenes={ordenesPag}
            loading={loading}
            filtroNumeroOrden={filtroNumeroOrden}
            onFiltroChange={setFiltroNumeroOrden}
            filtroCliente={filtroCliente}
            onFiltroClienteChange={setFiltroCliente}
            filtroSerie={filtroSerie}
            onFiltroSerieChange={setFiltroSerie}
            filtroEstado={filtroEstado}
            onFiltroEstadoChange={setFiltroEstado}
            filtroGarantia={filtroGarantia}
            onFiltroGarantiaChange={setFiltroGarantia}
            filtroFechaDesde={filtroFechaDesde}
            onFiltroFechaDesdeChange={setFiltroFechaDesde}
            filtroFechaHasta={filtroFechaHasta}
            onFiltroFechaHastaChange={setFiltroFechaHasta}
            onLimpiar={() => { setFiltroNumeroOrden(""); setFiltroCliente(""); setFiltroSerie(""); setFiltroEstado("todos"); setFiltroGarantia("todos"); setFiltroFechaDesde(""); setFiltroFechaHasta(""); }}
            onNueva={() => abrirNuevaOrden()}
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onPageChange={setPaginaActual}
            onVer={verOrden}
            onEditar={editarOrden}
            onEliminar={eliminarOrden}
            onInforme={(orden) => navigate('/informes', { state: { orden } })}
            onCotizacion={(orden) => navigate('/cotizaciones', { state: { orden } })}
            onPDF={setOrdenParaPDF}
          />
          </div>
        ) : (
          /* Formulario para crear orden */
          <>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px' }}>
            <div className="of-wrap">
              <OrdenFormCabecera
                soloLectura={soloLectura} editingId={editingId}
                tecnico={ordenIdActual ? nuevaOrden.tecnicoAsignado : tecnicoDeSesion()}
                cantidadCotizaciones={cotizacionesDeOrden.length} onCerrar={cerrarFormulario}
              />
            <form onSubmit={guardarOrden} className="of-form" noValidate>
              <div className="of-col-full">
                <OrdenFormDatos
                  nuevaOrden={nuevaOrden}
                  setNuevaOrden={setNuevaOrden}
                  readOnly={soloLectura}
                />
              </div>

              <div className="of-cols">
                <div className="of-col-left">
                <OrdenFormCliente
                  busquedaCliente={busquedaCliente}
                  setBusquedaCliente={setBusquedaCliente}
                  mostrarDropdownClientes={mostrarDropdownClientes}
                  setMostrarDropdownClientes={setMostrarDropdownClientes}
                  clienteSeleccionado={clienteSeleccionado}
                  clientesFiltrados={clientesFiltrados}
                  clienteDropdownRef={clienteDropdownRef}
                  seleccionarCliente={seleccionarCliente}
                  nuevaOrden={nuevaOrden}
                  setNuevaOrden={setNuevaOrden}
                  clienteInactivo={clienteInactivo}
                  clienteFijo={clienteFijo}
                  readOnly={soloLectura}
                  setClienteSeleccionado={setClienteSeleccionado}
                  adjuntos={adjuntos}
                />

                <OrdenCotizaciones key={ordenIdActual} cotizaciones={cotizacionesDeOrden} ordenIdActual={ordenIdActual} soloLectura={soloLectura} />
                </div>

                <div className="of-col-right">
                <OrdenFormEquipo
                  busquedaModelo={busquedaModelo}
                  setBusquedaModelo={setBusquedaModelo}
                  mostrarDropdownModelo={mostrarDropdownModelo}
                  setMostrarDropdownModelo={setMostrarDropdownModelo}
                  equiposModeloFiltrados={equiposModeloFiltrados}
                  equipoModeloDropdownRef={equipoModeloDropdownRef}
                  seleccionarEquipoPorModelo={seleccionarEquipoPorModelo}
                  nuevaOrden={nuevaOrden}
                  setNuevaOrden={setNuevaOrden}
                  readOnly={soloLectura}
                  equipoFijo={equipoFijo}
                  editingId={editingId}
                  onRegistrarEquipo={registrarEquipoEnMantenedor}
                  equipoExistente={equipoExistente}
                  onEquipoCambiado={refrescarEquipo}
                />

                <OrdenFormInsumos
                  insumos={insumos}
                  insumosVisibles={insumosVisibles}
                  setInsumosVisibles={setInsumosVisibles}
                  setInsumos={setInsumos}
                  readOnly={soloLectura}
                />

                  <OrdenFormAveria
                    nuevaOrden={nuevaOrden}
                    setNuevaOrden={setNuevaOrden}
                    readOnly={soloLectura}
                  />

                  <OrdenFormObservaciones
                    nuevaOrden={nuevaOrden}
                    setNuevaOrden={setNuevaOrden}
                    readOnly={soloLectura}
                  />
                </div>
              </div>

              <OrdenFormBotones
                soloLectura={soloLectura} editingId={editingId} guardando={guardando}
                onCerrar={cerrarFormulario} onGuardarCambios={(e) => guardarOrden(e, true)}
                onPDF={generarPDFOrdenActual} onCotizacion={irACotizacionOrdenActual}
              />
            </form>
            </div>
          </div></>
        )}

      {ordenParaPDF && (
        <ModalOpcionesPDF orden={ordenParaPDF} onClose={() => setOrdenParaPDF(null)} />
      )}
    </div>
  );
}

export default OrdenTrabajo;