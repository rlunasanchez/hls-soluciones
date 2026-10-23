import { useState, useEffect, useRef, useCallback } from "react";
import { getCached } from "../services/cache";
import { usePaginaPersistente, useClampPagina } from "./usePaginacion";
import useValorRetrasado from "./useValorRetrasado";

const EQUIPOS_POR_PAGINA = 4;

// Listado de Equipos: el filtro por modelo y la paginación se resuelven en el servidor
// (GET /api/equipos?pagina=&limite=&modelo=); aquí solo se guarda la página en pantalla.
// La página se conserva entre recargas. El texto se envía 300 ms después de dejar de escribir.
export default function useEquiposListado() {
  const [equipos, setEquipos] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalEquipos, setTotalEquipos] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filtroModelo, setFiltroModelo] = useState("");
  const [paginaActual, setPaginaActual] = usePaginaPersistente("pagEquipos", [filtroModelo]);

  const modelo = useValorRetrasado(filtroModelo).trim();

  const params = new URLSearchParams({ pagina: paginaActual, limite: EQUIPOS_POR_PAGINA });
  if (modelo) params.set("modelo", modelo);
  const url = `/api/equipos?${params}`;

  const urlRef = useRef(url);
  urlRef.current = url;
  const secuencia = useRef(0);
  const primeraCarga = useRef(true);

  // Pide al servidor la página actual. Una respuesta vieja nunca pisa a una más nueva.
  const fetchEquipos = useCallback(async (signal) => {
    const mia = ++secuencia.current;
    if (primeraCarga.current) setLoading(true);
    try {
      const res = await getCached(urlRef.current, { signal });
      if (mia !== secuencia.current) return;
      setEquipos(res.data.equipos);
      setTotalPaginas(res.data.pagination.totalPages);
      setTotalEquipos(res.data.pagination.totalItems);
      primeraCarga.current = false;
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar equipos:", err);
    } finally {
      if (mia === secuencia.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchEquipos(controller.signal);
    return () => controller.abort();
  }, [url, fetchEquipos]);

  useClampPagina(paginaActual, setPaginaActual, totalPaginas);

  return {
    equipos, loading, fetchEquipos, totalPaginas, totalEquipos, paginaActual, setPaginaActual,
    filtroModelo, setFiltroModelo
  };
}
