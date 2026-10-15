import { useState } from "react";
import { getCached } from "../services/cache";
import { usePaginaPersistente, useClampPagina } from "./usePaginacion";

const ITEMS_POR_PAG = 4;

// Listado de órdenes de trabajo: carga, filtros, paginación (la página se conserva entre recargas).
// Trae todas las órdenes y filtra/pagina en el frontend (datasets pequeños).
export default function useOrdenesListado() {
  const [ordenes, setOrdenes] = useState([]);
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

  const fetchOrdenes = async (signal) => {
    setLoading(true);
    try {
      const res = await getCached("/api/ordenes?page=1&limit=10000", { signal });
      setOrdenes(res.data.ordenes);
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar órdenes:", err);
    } finally {
      setLoading(false);
    }
  };

  const ordenesFiltradas = ordenes.filter((orden) => {
    if (filtroNumeroOrden && !orden.numero_orden?.toLowerCase().includes(filtroNumeroOrden.toLowerCase())) return false;
    if (filtroCliente && !orden.cliente?.toLowerCase().includes(filtroCliente.toLowerCase())) return false;
    if (filtroSerie && !orden.serie?.toLowerCase().includes(filtroSerie.toLowerCase())) return false;
    if (filtroEstado === "cerrada" && !orden.fecha_entrega) return false;
    if (filtroEstado === "pendiente" && orden.fecha_entrega) return false;
    if (filtroGarantia === "si" && !orden.es_garantia) return false;
    if (filtroGarantia === "no" && orden.es_garantia) return false;
    if (filtroFechaDesde && orden.fecha && orden.fecha.substring(0, 10) < filtroFechaDesde) return false;
    if (filtroFechaHasta && orden.fecha && orden.fecha.substring(0, 10) > filtroFechaHasta) return false;
    return true;
  });

  const totalPaginas = Math.ceil(ordenesFiltradas.length / ITEMS_POR_PAG);
  const ordenesPag = ordenesFiltradas.slice((paginaActual - 1) * ITEMS_POR_PAG, paginaActual * ITEMS_POR_PAG);

  useClampPagina(paginaActual, setPaginaActual, totalPaginas);

  return {
    ordenes, loading, fetchOrdenes, ordenesPag, totalPaginas, paginaActual, setPaginaActual,
    filtroNumeroOrden, setFiltroNumeroOrden, filtroCliente, setFiltroCliente, filtroSerie, setFiltroSerie,
    filtroEstado, setFiltroEstado, filtroGarantia, setFiltroGarantia,
    filtroFechaDesde, setFiltroFechaDesde, filtroFechaHasta, setFiltroFechaHasta
  };
}
