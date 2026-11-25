import { useState } from "react";
import useListadoPaginado from "./useListadoPaginado";

// Listado de Clientes: el filtro por nombre y por RUT y la paginación se resuelven en el servidor
// (GET /api/clientes?pagina=&limite=&nombre=&rut=). Ver useListadoPaginado.
export default function useClientesListado() {
  const [busqueda, setBusqueda] = useState("");
  const [filtroRut, setFiltroRut] = useState("");
  const { filas, recargar, total, ...resto } = useListadoPaginado({
    url: "/api/clientes", clave: "clientes", clavePagina: "pagClientes", filtros: { nombre: busqueda, rut: filtroRut }
  });
  return { clientes: filas, fetchClientes: recargar, totalClientes: total, ...resto, busqueda, setBusqueda, filtroRut, setFiltroRut };
}
