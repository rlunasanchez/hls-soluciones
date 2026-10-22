import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, Users, Contact, MapPin, Package, FileText, FileSpreadsheet, ShoppingCart, UserCog
} from "lucide-react";
import api from "../services/api";
import { getCached } from "../services/cache";
import useBusquedaApi from "../hooks/useBusquedaApi";
import { verificarCliente, clienteDeOrden } from "../utils/clientesApi";
import { toUpper, cerrarSesion } from "../utils/helpers";
import { ordenAFormulario, buscarEquipoDeOrden, insumosDeOrden, ordenVacia, insumosVacios, ordenParaCliente, tecnicoDeSesion, datosAlElegirCliente } from "../utils/ordenFormato";
import { validarOrden, armarPayloadOrden } from "../utils/validarOrden";
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
  const [guardando, setGuardando] = useState(false);
  const guardandoRef = useRef(false);

  // Id de la orden abierta en el formulario, tanto en modo Editar como en modo
  // Ver (a diferencia de editingId, que en modo Ver queda en null). Sirve para
  // consultar las cotizaciones asociadas sin importar el modo.
  const [ordenIdActual, setOrdenIdActual] = useState(null);
  const cotizacionesDeOrden = useCotizacionesDeOrden(ordenIdActual);

  // Estado para autocompletar equipos (los clientes se buscan en el servidor al escribir)
  const [equipos, setEquipos] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [clienteFijo, setClienteFijo] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [equipoFijo, setEquipoFijo] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaModelo, setBusquedaModelo] = useState("");
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [mostrarDropdownModelo, setMostrarDropdownModelo] = useState(false);
  const [equiposModeloSugeridos, setEquiposModeloSugeridos] = useState([]);
  const [clienteInactivo, setClienteInactivo] = useState(false);
  const [soloLectura, setSoloLectura] = useState(false);
  const [ordenParaPDF, setOrdenParaPDF] = useState(null);
  
  // Refs para detectar clics fuera de los dropdowns
  const equipoModeloDropdownRef = useRef(null);
  const clienteDropdownRef = useRef(null);
  
  // Insumos dinámicos (se muestran de a 2; hasta 12)
  const [insumos, setInsumos] = useState(insumosVacios);
  const [insumosVisibles, setInsumosVisibles] = useState(2);

  // Estado principal de la orden
  const [nuevaOrden, setNuevaOrden] = useState(() => ordenVacia(tecnicoDeSesion()));

  // Cargar los equipos al montar el componente (las órdenes las pide el hook del listado)
  useEffect(() => {
    const controller = new AbortController();
    fetchEquipos(controller.signal);
    return () => controller.abort();
  }, []);

  // Recibir cliente u orden desde Clientes
  useEffect(() => {
    const init = async () => {
      const navState = window.history.state?.usr;
      
      // Limpiar siempre al inicio
      setMostrarFormulario(false);
      setEditingId(null);
      
      // Solo procesar si hay datos de cliente, orden, o una orden puntual a reabrir
      if (!navState || (!navState?.cliente && !navState?.orden && !navState?.verOrdenId)) return;

      const ordenFromNav = navState?.orden;
      const clienteFromNav = navState?.cliente;
      const verOrdenId = navState?.verOrdenId;
      const verOrdenSoloLectura = navState?.verOrdenSoloLectura;

      if (ordenFromNav) {
        // Cargar equipos frescos antes de editar la orden
        await fetchEquipos();
        editarOrden(ordenFromNav);
        window.history.replaceState({}, document.title);
      }

      // Volver a la OT desde la que se abrió una cotización asociada (chip
      // "Cotizaciones Asociadas" → Cancelar/Cerrar en la Cotización), en el
      // mismo modo en que estaba: Ver o Editar.
      if (verOrdenId) {
        await fetchEquipos();
        if (verOrdenSoloLectura) {
          verOrden({ id: verOrdenId });
        } else {
          editarOrden({ id: verOrdenId });
        }
        window.history.replaceState({}, document.title);
      }

      if (clienteFromNav) await abrirNuevaOrden(clienteFromNav);
    };
    init();
  }, []);

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
    setEquipoSeleccionado(null);
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

  // Buscar equipos por modelo via API
  useEffect(() => {
    if (busquedaModelo.length < 2) { setEquiposModeloSugeridos([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/equipos?q=${encodeURIComponent(busquedaModelo)}`);
        setEquiposModeloSugeridos(res.data);
      } catch { setEquiposModeloSugeridos([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaModelo]);

  // Cierra los dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (equipoModeloDropdownRef.current && !equipoModeloDropdownRef.current.contains(event.target)) {
        setMostrarDropdownModelo(false);
      }
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target)) {
        setMostrarDropdownClientes(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Abre una orden guardada en el formulario. modo "editar" la deja editable; modo "ver", en solo lectura.
  // El listado no trae "adjunto" (es pesado): la orden completa se pide recién al abrirla.
  const cargarOrden = async (ordenListado, modo) => {
    const { data: orden } = await api.get(`/api/ordenes/${ordenListado.id}`);

    setSoloLectura(modo === "ver");
    setEditingId(modo === "editar" ? orden.id : null);
    setOrdenIdActual(orden.id);
    setClienteFijo(false);
    setEquipoFijo(false);
    setMostrarFormulario(true);

    // Los campos de la OT son una copia (snapshot): no se pisan con datos frescos del cliente/equipo
    setNuevaOrden(ordenAFormulario(orden));

    // Si el equipo coincide con un registro del mantenedor se marca como seleccionado
    // (habilita los botones Ver/Editar del equipo)
    setEquipoSeleccionado(buscarEquipoDeOrden(orden, equipos));

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

  const fetchEquipos = async (signal) => {
    try {
      const res = await getCached("/api/equipos", { signal });
      setEquipos(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar equipos:", err);
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
      setEquipoSeleccionado(null);
      setBusquedaModelo("");
    }
    setNuevaOrden(prev => ({ ...prev, ...datosAlElegirCliente(cliente, { editando: !!editingId, mismoCliente }) }));
  };

  // Seleccionar solo el modelo - NO vincula serie ni equipo (solo rellena los datos del modelo)
  const seleccionarEquipoPorModelo = (equipo) => {
    setNuevaOrden(prev => ({
      ...prev,
      equipo: toUpper(equipo.equipo),
      modelo: toUpper(equipo.modelo),
      marca: toUpper(equipo.marca),
      serie: ""
      // NOTA: No vincula equipo (equipoId = null) ni serie, solo los datos del modelo
    }));

     setBusquedaModelo((equipo.modelo || "").toUpperCase());
     setMostrarDropdownModelo(false);
  };

  // Buscador de cliente: consulta al servidor desde 2 caracteres (hasta 10 resultados, por nombre,
  // código o dígitos del RUT). null mientras responde.
  const [resultadosCliente] = useBusquedaApi("/api/clientes", busquedaCliente);
  const clientesFiltrados = busquedaCliente.length >= 2 ? resultadosCliente : [];

  // Modelos únicos (sin duplicar por serie) para el buscador de modelo
  const equiposModeloFiltrados = [...new Map(equiposModeloSugeridos.map(eq => [eq.modelo, eq])).values()];

  // Registra el equipo del form OT en el mantenedor (la serie es opcional).
  // Se usa desde el botón "+ Registrar en Equipos" al crear o editar una OT.
  const registrarEquipoEnMantenedor = async () => {
    const { equipo, marca, modelo, serie } = nuevaOrden;
    try {
      const res = await api.post("/api/equipos", { equipo, marca, modelo, serie });
      alert(`Equipo creado en el mantenedor con código ${res.data.codigo}.`);
      const lista = await api.get("/api/equipos");
      setEquipos(lista.data);
    } catch (err) {
      const msg = err.response?.data?.msg;
      alert(msg || "Error al registrar el equipo en el mantenedor.");
    }
  };

  // PDF y Cotización de la orden que está abierta en el formulario (ya
  // guardada al menos una vez, con editingId). Traen los datos frescos de
  // la orden para no trabajar con lo que quedó en el estado del formulario.
  const generarPDFOrdenActual = async () => {
    if (!editingId) return;
    const res = await api.get(`/api/ordenes/${editingId}`);
    setOrdenParaPDF(res.data);
  };

  const irACotizacionOrdenActual = async () => {
    if (!editingId) return;
    const res = await api.get(`/api/ordenes/${editingId}`);
    navigate('/cotizaciones', { state: { orden: res.data } });
  };

  const guardarOrden = async (e, mantener = false) => {
    e.preventDefault();
    if (guardandoRef.current) return;

    let verificacion;
    try {
      verificacion = await verificarCliente({ rut: nuevaOrden.rut, razon_social: nuevaOrden.cliente });
    } catch {
      alert("No se pudo comprobar el cliente. Revise la conexión e intente de nuevo.");
      return;
    }
    const mensajeError = validarOrden(nuevaOrden, { verificacion, clienteSeleccionado });
    if (mensajeError) {
      alert(mensajeError);
      return;
    }

    const payload = armarPayloadOrden(nuevaOrden, insumos, clienteSeleccionado);

    const eraOrdenNueva = !editingId;
    guardandoRef.current = true;
    setGuardando(true);
    try {
      let idActual = editingId;
      if (editingId) {
        await api.put(`/api/ordenes/${editingId}`, payload);
      } else {
        const res = await api.post("/api/ordenes", payload);
        idActual = res.data.id;
        setEditingId(idActual);
      }

      if (mantener) {
        // "Guardar Cambios"/"Guardar": guarda y se mantiene en la OT para seguir editando o generar el PDF
        const res = await api.get(`/api/ordenes/${idActual}`);
        await editarOrden(res.data);
      } else {
        alert(eraOrdenNueva ? "Orden guardada exitosamente" : "Orden actualizada exitosamente");
        setMostrarFormulario(false);
        resetFormulario();
        setSoloLectura(false);
        window.history.replaceState({}, document.title);
        // Guardar (a diferencia de Cancelar/X) siempre deja en el mantenedor de OT,
        // aunque se haya creado desde Clientes — para eso está el listado de OT.
        // Una orden nueva queda primera (backend ordena por id DESC): saltar a la página 1 para verla.
        // Al editar se conserva la página en la que estaba el usuario.
        if (eraOrdenNueva) setPaginaActual(1);
        fetchOrdenes();
      }
    } catch (err) {
      console.error("Error al guardar orden:", err);
      alert("Error al guardar la orden");
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  };

  const resetFormulario = () => {
    setNuevaOrden(ordenVacia(tecnicoDeSesion()));
    setInsumos(insumosVacios());
    setInsumosVisibles(2);
    setClienteSeleccionado(null);
    setClienteFijo(false);
    setEquipoSeleccionado(null);
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
  // Funciones de navegación eliminadas (accesos desde el menú)

  const navItems = [
    { label: "Inicio", icon: Home, onClick: () => navigate("/home"), color: "var(--gradient)" },
    { label: "Clientes", icon: Users, onClick: () => navigate("/clientes"), color: "var(--primary)" },
    { label: "Contactos", icon: Contact, onClick: () => navigate("/contactos"), color: "#7C3AED" },
    { label: "Direcciones", icon: MapPin, onClick: () => navigate("/direcciones"), color: "#0891B2" },
    { label: "Equipos", icon: Package, onClick: () => navigate("/equipos"), color: "var(--success)" },
    { label: "Informes Técnicos", icon: FileText, onClick: () => navigate("/informes"), color: "#EA580C" },
    { label: "Cotizaciones", icon: FileSpreadsheet, onClick: () => navigate("/cotizaciones"), color: "#DB2777" },
    { label: "Orden de Compra", icon: ShoppingCart, onClick: () => navigate("/orden-compra"), color: "#1E40AF" },
    { label: "Usuarios", icon: UserCog, onClick: () => navigate("/usuarios"), color: "#0D9488" },
  ];

  return (
    <div className="container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <HeaderOrdenTrabajo navItems={navItems} onLogout={cerrarSesion} />

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
                  equipoSeleccionado={equipoSeleccionado}
                  nuevaOrden={nuevaOrden}
                  setNuevaOrden={setNuevaOrden}
                  readOnly={soloLectura}
                  equipos={equipos}
                  equipoFijo={equipoFijo}
                  editingId={editingId}
                  onRegistrarEquipo={registrarEquipoEnMantenedor}
                  onEquiposRefresh={(lista) => setEquipos(lista)}
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