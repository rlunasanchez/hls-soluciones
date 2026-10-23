import { useState, useEffect } from "react";
import { verificarEquipo } from "../utils/equiposApi";
import useValorRetrasado from "./useValorRetrasado";

const norm = (v) => String(v || "").trim().toLowerCase();

// ¿El equipo escrito en la OT (Equipo + Marca + Modelo) ya está en el mantenedor de Equipos?
// Mientras se escribe, pregunta al servidor 300 ms después de dejar de escribir. Devuelve
// [equipoExistente | null, refrescar]:
//  - Si los datos escritos ya no coinciden con el equipo encontrado se considera inexistente de inmediato.
//  - refrescar(equipo) fija el equipo ya conocido sin esperar (al abrir una OT, elegir un equipo del
//    buscador, editarlo o registrarlo); refrescar() sin argumento vuelve a preguntar al servidor.
export default function useEquipoExistente({ equipo, marca, modelo }) {
  const [encontrado, setEncontrado] = useState(null);
  const [vez, setVez] = useState(0);
  const clave = useValorRetrasado(`${equipo}|${marca}|${modelo}`);

  useEffect(() => {
    const [e, ma, mo] = clave.split("|");
    if (!norm(e)) { setEncontrado(null); return undefined; }
    const controller = new AbortController();
    verificarEquipo({ equipo: e, marca: ma, modelo: mo }, controller.signal).then((r) => {
      if (!controller.signal.aborted) setEncontrado(r);
    });
    return () => controller.abort();
  }, [clave, vez]);

  const vigente = encontrado && norm(encontrado.equipo) === norm(equipo) && norm(encontrado.marca) === norm(marca)
    && norm(encontrado.modelo) === norm(modelo) ? encontrado : null;
  const refrescar = (conocido) => (conocido ? setEncontrado(conocido) : setVez((v) => v + 1));
  return [vigente, refrescar];
}
