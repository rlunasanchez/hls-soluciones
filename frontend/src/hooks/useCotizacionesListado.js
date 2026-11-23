import { useState, useEffect, useCallback } from "react";
import { getCached } from "../services/cache";
import { usePaginaPersistente, useClampPagina } from "./usePaginacion";
import useFilasPorPantalla from "./useFilasPorPantalla";

// Listado de Cotizaciones: carga, filtros por folio y cliente, y paginación (en el navegador por ahora).
// Las filas por página dependen del alto de la pantalla, como en el resto de los listados.
export default function useCotizacionesListado() {
  const itemsPorPagina = useFilasPorPantalla();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroFolio, setFiltroFolio] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [paginaActual, setPaginaActual] = usePaginaPersistente("pagCotizaciones", [filtroFolio, filtroCliente]);

  const fetchCotizaciones = useCallback(async (signal) => {
    setLoading(true);
    try {
      const res = await getCached("/api/cotizaciones?page=1&limit=10000", { signal });
      setCotizaciones(res.data.cotizaciones);
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar cotizaciones:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchCotizaciones(controller.signal);
    return () => controller.abort();
  }, [fetchCotizaciones]);

  const filtradas = cotizaciones.filter((cot) => {
    if (filtroFolio && !String(cot.folio).includes(filtroFolio.trim())) return false;
    if (filtroCliente && !cot.cliente?.toLowerCase().includes(filtroCliente.toLowerCase())) return false;
    return true;
  });
  const totalPaginas = Math.ceil(filtradas.length / itemsPorPagina);
  const pagina = filtradas.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina);
  useClampPagina(paginaActual, setPaginaActual, totalPaginas);

  return {
    cotizaciones: pagina, loading, fetchCotizaciones,
    filtroFolio, setFiltroFolio, filtroCliente, setFiltroCliente,
    paginaActual, setPaginaActual, totalPaginas,
    limpiarFiltros: () => { setFiltroFolio(""); setFiltroCliente(""); }
  };
}
