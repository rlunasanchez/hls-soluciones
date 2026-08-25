import { useState, useEffect, useRef } from "react";

/**
 * Paginación que recuerda la página entre recargas (F5) y al abrir/cerrar formularios.
 *
 * Devuelve el par [paginaActual, setPaginaActual], igual que un useState normal,
 * así que se usa como reemplazo directo de `useState(1)`.
 *
 * @param {string} clave    Clave de sessionStorage, única por módulo (ej: "pagClientes")
 * @param {Array}  filtros  Valores de los filtros del listado: al cambiar cualquiera
 *                          se vuelve a la página 1. El array debe tener siempre el
 *                          mismo largo entre renders (es la lista de dependencias).
 */
export function usePaginaPersistente(clave, filtros = []) {
  const [paginaActual, setPaginaActual] = useState(() => {
    const guardada = Number(sessionStorage.getItem(clave));
    return guardada >= 1 ? guardada : 1;
  });

  // Guardar la página elegida para poder restaurarla tras un F5
  useEffect(() => {
    sessionStorage.setItem(clave, String(paginaActual));
  }, [clave, paginaActual]);

  // Volver a la página 1 al cambiar un filtro, pero NO en el montaje.
  // useEffect siempre corre después del primer render (el array de dependencias
  // solo controla las corridas siguientes), así que sin esta guarda el efecto
  // pisaría con un 1 la página recién restaurada desde sessionStorage.
  const esMontaje = useRef(true);
  useEffect(() => {
    if (esMontaje.current) {
      esMontaje.current = false;
      return;
    }
    setPaginaActual(1);
  }, filtros);

  return [paginaActual, setPaginaActual];
}

/**
 * Evita quedarse en una página fuera de rango cuando cambian los datos
 * (ej: eliminar el último registro de la última página).
 *
 * Llamar después de calcular `totalPaginas`. La guarda `totalPaginas > 0` es la
 * que impide pisar la página restaurada mientras el listado todavía está cargando.
 */
export function useClampPagina(paginaActual, setPaginaActual, totalPaginas) {
  useEffect(() => {
    if (totalPaginas > 0 && paginaActual > totalPaginas) setPaginaActual(totalPaginas);
  }, [totalPaginas, paginaActual, setPaginaActual]);
}
