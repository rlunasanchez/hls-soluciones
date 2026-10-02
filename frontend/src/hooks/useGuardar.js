import { useState, useRef } from "react";

// Estado "guardando" de una ficha: evita doble envío (doble clic) y deshabilita los botones.
// guardar(accion) ejecuta accion() (que puede ser async) y libera el estado al terminar.
export default function useGuardar() {
  const [guardando, setGuardando] = useState(false);
  const ocupado = useRef(false);

  const guardar = (accion) => {
    if (ocupado.current) return;
    ocupado.current = true;
    setGuardando(true);
    Promise.resolve(accion()).finally(() => {
      ocupado.current = false;
      setGuardando(false);
    });
  };

  return [guardando, guardar];
}
