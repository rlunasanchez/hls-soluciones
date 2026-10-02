import { useState, useEffect } from "react";
import api from "../services/api";

// Busca en la API mientras se escribe, con espera y cancelando la consulta anterior.
// Devuelve [resultados, recargar]: resultados es null mientras no hay consulta (texto corto
// o todavía cargando) y la lista cuando respondió; recargar() repite la consulta.
export default function useBusquedaApi(url, texto, { min = 2, espera = 250 } = {}) {
  const [datos, setDatos] = useState(null);
  const [vez, setVez] = useState(0);

  useEffect(() => {
    setDatos(null);
    const q = String(texto || "").trim();
    if (q.length < min) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`${url}?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        setDatos(res.data);
      } catch (err) {
        if (err.name !== "CanceledError") setDatos(null);
      }
    }, espera);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [url, texto, min, espera, vez]);

  return [datos, () => setVez((v) => v + 1)];
}
