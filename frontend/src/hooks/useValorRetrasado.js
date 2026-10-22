import { useState, useEffect } from "react";

// Devuelve `valor` solo cuando deja de cambiar durante `espera` ms (para no consultar al
// servidor en cada tecla). El primer valor se devuelve de inmediato.
export default function useValorRetrasado(valor, espera = 300) {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const timer = setTimeout(() => setRetrasado(valor), espera);
    return () => clearTimeout(timer);
  }, [valor, espera]);
  return retrasado;
}
