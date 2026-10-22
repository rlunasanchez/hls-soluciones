import { useState, useEffect, useRef, useCallback } from "react";
import { getCached } from "../services/cache";
import { usePaginaPersistente, useClampPagina } from "./usePaginacion";
import useValorRetrasado from "./useValorRetrasado";

const ITEMS_POR_PAG = 4;

// Listado de órdenes de trabajo: filtros y paginación se resuelven en el servidor
// (GET /api/ordenes?pagina=&limite=&numero=…); aquí solo se guarda la página en pantalla.
// La página se conserva entre recargas.
export default function useOrdenesListado() {
  const [ordenes, setOrdenes] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filtroNumeroOrden, setFiltroNumeroOrden] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroSerie, setFiltroSerie] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroGarantia, setFiltroGarantia] = useState("todos");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [paginaActual, setPaginaActual] = usePaginaPersistente("pagOrdenes", [
    filtroNumeroOrden, filtroCliente, filtroSerie, filtroEstado, filtroGarantia, filtroFechaDesde, filtroFechaHasta
  ]);

  // Los textos se envían al servidor 300 ms después de dejar de escribir
  const numero = useValorRetrasado(filtroNumeroOrden);
  const cliente = useValorRetrasado(filtroCliente);
  const serie = useValorRetrasado(filtroSerie);

  const params = new URLSearchParams({ pagina: paginaActual, limite: ITEMS_POR_PAG });
  if (numero.trim()) params.set("numero", numero.trim());
  if (cliente.trim()) params.set("cliente", cliente.trim());
  if (serie.trim()) params.set("serie", serie.trim());
  if (filtroEstado !== "todos") params.set("estado", filtroEstado);
  if (filtroGarantia !== "todos") params.set("garantia", filtroGarantia);
  if (filtroFechaDesde) params.set("desde", filtroFechaDesde);
  if (filtroFechaHasta) params.set("hasta", filtroFechaHasta);
  const url = `/api/ordenes?${params}`;

  const urlRef = useRef(url);
  urlRef.current = url;
  const secuencia = useRef(0);
  const primeraCarga = useRef(true);

  // Pide al servidor la página actual. Una respuesta vieja nunca pisa a una más nueva.
  const fetchOrdenes = useCallback(async (signal) => {
    const mia = ++secuencia.current;
    if (primeraCarga.current) setLoading(true);
    try {
      const res = await getCached(urlRef.current, { signal });
      if (mia !== secuencia.current) return;
      setOrdenes(res.data.ordenes);
      setTotalPaginas(res.data.pagination.totalPages);
      primeraCarga.current = false;
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar órdenes:", err);
    } finally {
      if (mia === secuencia.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrdenes(controller.signal);
    return () => controller.abort();
  }, [url, fetchOrdenes]);

  useClampPagina(paginaActual, setPaginaActual, totalPaginas);

  return {
    ordenes, loading, fetchOrdenes, ordenesPag: ordenes, totalPaginas, paginaActual, setPaginaActual,
    filtroNumeroOrden, setFiltroNumeroOrden, filtroCliente, setFiltroCliente, filtroSerie, setFiltroSerie,
    filtroEstado, setFiltroEstado, filtroGarantia, setFiltroGarantia,
    filtroFechaDesde, setFiltroFechaDesde, filtroFechaHasta, setFiltroFechaHasta
  };
}
