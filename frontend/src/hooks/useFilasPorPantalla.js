import { useState, useEffect } from "react";

// Cuántas filas de un listado caben en la pantalla: (alto de la ventana - lo que ocupan el menú, los
// filtros y el encabezado de la tabla) / alto de una fila. En móvil (tarjetas) se usa el mínimo.
// Se recalcula al cambiar el tamaño de la ventana.
const calcular = ({ alturaFila, reservado, min, max }) => {
  if (window.innerWidth <= 768) return min;
  const filas = Math.floor((window.innerHeight - reservado) / alturaFila);
  return Math.min(max, Math.max(min, filas));
};

export default function useFilasPorPantalla({ alturaFila = 58, reservado = 280, min = 4, max = 20 } = {}) {
  const [filas, setFilas] = useState(() => calcular({ alturaFila, reservado, min, max }));

  useEffect(() => {
    let espera;
    const alCambiar = () => {
      clearTimeout(espera);
      espera = setTimeout(() => setFilas(calcular({ alturaFila, reservado, min, max })), 200);
    };
    window.addEventListener("resize", alCambiar);
    return () => { clearTimeout(espera); window.removeEventListener("resize", alCambiar); };
  }, [alturaFila, reservado, min, max]);

  return filas;
}
