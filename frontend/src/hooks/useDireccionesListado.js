import { useState } from "react";
import useListadoPaginado from "./useListadoPaginado";

// Listado de Direcciones: el filtro por dirección y la paginación se resuelven en el servidor
// (GET /api/direcciones?pagina=&limite=&direccion=). Ver useListadoPaginado.
export default function useDireccionesListado() {
  const [filtroDireccion, setFiltroDireccion] = useState("");
  const listado = useListadoPaginado({
    url: "/api/direcciones", clave: "direcciones", clavePagina: "pagDirecciones", filtros: { direccion: filtroDireccion }
  });
  const { filas, ...resto } = listado;
  return { direcciones: filas, ...resto, filtroDireccion, setFiltroDireccion };
}
