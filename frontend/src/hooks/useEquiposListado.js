import { useState } from "react";
import useListadoPaginado from "./useListadoPaginado";

// Listado de Equipos: el filtro por modelo y la paginación se resuelven en el servidor
// (GET /api/equipos?pagina=&limite=&modelo=). Ver useListadoPaginado.
export default function useEquiposListado() {
  const [filtroModelo, setFiltroModelo] = useState("");
  const { filas, recargar, total, ...resto } = useListadoPaginado({
    url: "/api/equipos", clave: "equipos", clavePagina: "pagEquipos", filtros: { modelo: filtroModelo }
  });
  return { equipos: filas, fetchEquipos: recargar, totalEquipos: total, ...resto, filtroModelo, setFiltroModelo };
}
