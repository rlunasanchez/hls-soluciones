import { useState } from "react";
import useListadoPaginado from "./useListadoPaginado";

// Listado de Contactos: el filtro por nombre y la paginación se resuelven en el servidor
// (GET /api/contactos?pagina=&limite=&nombre=). Ver useListadoPaginado.
export default function useContactosListado() {
  const [filtroNombre, setFiltroNombre] = useState("");
  const listado = useListadoPaginado({
    url: "/api/contactos", clave: "contactos", clavePagina: "pagContactos", filtros: { nombre: filtroNombre }
  });
  const { filas, ...resto } = listado;
  return { contactos: filas, ...resto, filtroNombre, setFiltroNombre };
}
