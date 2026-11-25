import { useState, useEffect, useRef, useCallback } from "react";
import { getCached } from "../services/cache";
import { usePaginaPersistente, useClampPagina } from "./usePaginacion";
import useValorRetrasado from "./useValorRetrasado";
import useFilasPorPantalla from "./useFilasPorPantalla";

// Listado de un módulo con paginación y filtros resueltos en el servidor: GET {url}?pagina=&limite=&<filtros>.
// El servidor responde { [clave]: [...], pagination }. Aquí solo se guarda la página en pantalla (se conserva
// entre recargas con `clavePagina`), las filas por pantalla (useFilasPorPantalla) y el texto de los filtros,
// que se envía 300 ms después de dejar de escribir. Una respuesta vieja nunca pisa a una más nueva.
// `filtros` es { parametro: valor }; los vacíos no se envían. Devuelve { filas, loading, recargar, ... }.
export default function useListadoPaginado({ url, clave, clavePagina, filtros }) {
  const [filas, setFilas] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const filasPorPagina = useFilasPorPantalla();
  const filtrosTexto = JSON.stringify(filtros);
  const [paginaActual, setPaginaActual] = usePaginaPersistente(clavePagina, [filtrosTexto]);

  const filtrosEnviados = JSON.parse(useValorRetrasado(filtrosTexto));
  const params = new URLSearchParams({ pagina: paginaActual, limite: filasPorPagina });
  Object.entries(filtrosEnviados).forEach(([nombre, valor]) => { if (String(valor).trim()) params.set(nombre, String(valor).trim()); });
  const consulta = `${url}?${params}`;

  const consultaRef = useRef(consulta);
  consultaRef.current = consulta;
  const secuencia = useRef(0);
  const primeraCarga = useRef(true);

  const recargar = useCallback(async (signal) => {
    const mia = ++secuencia.current;
    if (primeraCarga.current) setLoading(true);
    try {
      const res = await getCached(consultaRef.current, { signal });
      if (mia !== secuencia.current) return;
      setFilas(res.data[clave]);
      setTotalPaginas(res.data.pagination.totalPages);
      setTotal(res.data.pagination.totalItems);
      primeraCarga.current = false;
    } catch (err) {
      if (err.name !== "CanceledError") console.error(`Error al cargar ${clave}:`, err);
    } finally {
      if (mia === secuencia.current) setLoading(false);
    }
  }, [clave]);

  useEffect(() => {
    const controller = new AbortController();
    recargar(controller.signal);
    return () => controller.abort();
  }, [consulta, recargar]);

  useClampPagina(paginaActual, setPaginaActual, totalPaginas);

  return { filas, loading, recargar, totalPaginas, total, paginaActual, setPaginaActual };
}
