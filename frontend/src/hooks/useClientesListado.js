import { useState, useEffect, useRef, useCallback } from "react";
import { getCached } from "../services/cache";
import { usePaginaPersistente, useClampPagina } from "./usePaginacion";
import useValorRetrasado from "./useValorRetrasado";

const CLIENTES_POR_PAGINA = 4;

// Listado de Clientes: el filtro por nombre y por RUT y la paginación se resuelven en el servidor
// (GET /api/clientes?pagina=&limite=&nombre=&rut=); aquí solo se guarda la página en pantalla.
// La página se conserva entre recargas. Los textos se envían 300 ms después de dejar de escribir.
export default function useClientesListado() {
  const [clientes, setClientes] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRut, setFiltroRut] = useState("");
  const [paginaActual, setPaginaActual] = usePaginaPersistente("pagClientes", [busqueda, filtroRut]);

  const nombre = useValorRetrasado(busqueda).trim();
  const rut = useValorRetrasado(filtroRut).trim();

  const params = new URLSearchParams({ pagina: paginaActual, limite: CLIENTES_POR_PAGINA });
  if (nombre) params.set("nombre", nombre);
  if (rut) params.set("rut", rut);
  const url = `/api/clientes?${params}`;

  const urlRef = useRef(url);
  urlRef.current = url;
  const secuencia = useRef(0);
  const primeraCarga = useRef(true);

  // Pide al servidor la página actual. Una respuesta vieja nunca pisa a una más nueva.
  const fetchClientes = useCallback(async (signal) => {
    const mia = ++secuencia.current;
    if (primeraCarga.current) setLoading(true);
    try {
      const res = await getCached(urlRef.current, { signal });
      if (mia !== secuencia.current) return;
      setClientes(res.data.clientes);
      setTotalPaginas(res.data.pagination.totalPages);
      setTotalClientes(res.data.pagination.totalItems);
      primeraCarga.current = false;
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar clientes:", err);
    } finally {
      if (mia === secuencia.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchClientes(controller.signal);
    return () => controller.abort();
  }, [url, fetchClientes]);

  useClampPagina(paginaActual, setPaginaActual, totalPaginas);

  return {
    clientes, loading, fetchClientes, totalPaginas, totalClientes, paginaActual, setPaginaActual,
    busqueda, setBusqueda, filtroRut, setFiltroRut
  };
}
