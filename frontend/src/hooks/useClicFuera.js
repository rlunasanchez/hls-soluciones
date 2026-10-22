import { useEffect } from "react";

// Llama a `alCerrar` cuando se hace clic fuera del elemento al que apunta `ref` (cierra desplegables).
export default function useClicFuera(ref, alCerrar) {
  useEffect(() => {
    const clicFuera = (event) => {
      if (ref.current && !ref.current.contains(event.target)) alCerrar();
    };
    document.addEventListener("mousedown", clicFuera);
    return () => document.removeEventListener("mousedown", clicFuera);
  }, [ref, alCerrar]);
}
