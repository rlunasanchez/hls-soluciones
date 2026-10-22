import { useState, useEffect } from "react";
import api from "../services/api";

// Cotizaciones asociadas a la orden abierta (solo lectura, para el contador y los chips de la
// cabecera). Se vuelve a consultar cada vez que cambia la orden abierta.
export default function useCotizacionesDeOrden(ordenId) {
  const [cotizaciones, setCotizaciones] = useState([]);
  useEffect(() => {
    if (!ordenId) { setCotizaciones([]); return undefined; }
    const controller = new AbortController();
    api.get(`/api/cotizaciones?orden_id=${ordenId}&limit=100`, { signal: controller.signal })
      .then((res) => setCotizaciones(res.data.cotizaciones || []))
      .catch((err) => { if (err.name !== "CanceledError") setCotizaciones([]); });
    return () => controller.abort();
  }, [ordenId]);
  return cotizaciones;
}
