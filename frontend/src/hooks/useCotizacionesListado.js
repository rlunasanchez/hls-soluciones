import { useState } from "react";
import useListadoPaginado from "./useListadoPaginado";

// Listado de Cotizaciones: los filtros por folio y cliente y la paginación se resuelven en el servidor
// (GET /api/cotizaciones?pagina=&limite=&folio=&cliente=). Ver useListadoPaginado.
export default function useCotizacionesListado() {
  const [filtroFolio, setFiltroFolio] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const { filas, recargar, ...resto } = useListadoPaginado({
    url: "/api/cotizaciones", clave: "cotizaciones", clavePagina: "pagCotizaciones",
    filtros: { folio: filtroFolio, cliente: filtroCliente }
  });
  return {
    cotizaciones: filas, fetchCotizaciones: recargar, ...resto,
    filtroFolio, setFiltroFolio, filtroCliente, setFiltroCliente,
    limpiarFiltros: () => { setFiltroFolio(""); setFiltroCliente(""); }
  };
}
