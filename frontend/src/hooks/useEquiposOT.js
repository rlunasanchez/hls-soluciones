import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import { getCached } from "../services/cache";
import { toUpper } from "../utils/helpers";
import useClicFuera from "./useClicFuera";

// Equipos de la OT: lista del mantenedor, buscador por modelo con sus sugerencias, elegir un equipo
// (solo copia equipo/marca/modelo, la serie se borra) y registrar el de la OT en el mantenedor.
export default function useEquiposOT({ nuevaOrden, setNuevaOrden }) {
  const [equipos, setEquipos] = useState([]);
  const [busquedaModelo, setBusquedaModelo] = useState("");
  const [mostrarDropdownModelo, setMostrarDropdownModelo] = useState(false);
  const [equiposModeloSugeridos, setEquiposModeloSugeridos] = useState([]);
  const equipoModeloDropdownRef = useRef(null);

  const fetchEquipos = useCallback(async (signal) => {
    try {
      const res = await getCached("/api/equipos", { signal });
      setEquipos(res.data);
    } catch (err) {
      if (err.name !== "CanceledError") console.error("Error al cargar equipos:", err);
    }
  }, []);

  // Cargar los equipos al montar
  useEffect(() => {
    const controller = new AbortController();
    fetchEquipos(controller.signal);
    return () => controller.abort();
  }, [fetchEquipos]);

  // Buscar equipos por modelo en la API
  useEffect(() => {
    if (busquedaModelo.length < 2) { setEquiposModeloSugeridos([]); return undefined; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/api/equipos?q=${encodeURIComponent(busquedaModelo)}`);
        setEquiposModeloSugeridos(res.data);
      } catch { setEquiposModeloSugeridos([]); }
    }, 250);
    return () => clearTimeout(timer);
  }, [busquedaModelo]);

  useClicFuera(equipoModeloDropdownRef, useCallback(() => setMostrarDropdownModelo(false), []));

  // Seleccionar solo el modelo - NO vincula serie ni equipo (solo rellena los datos del modelo)
  const seleccionarEquipoPorModelo = (equipo) => {
    setNuevaOrden(prev => ({
      ...prev,
      equipo: toUpper(equipo.equipo),
      modelo: toUpper(equipo.modelo),
      marca: toUpper(equipo.marca),
      serie: ""
    }));
    setBusquedaModelo((equipo.modelo || "").toUpperCase());
    setMostrarDropdownModelo(false);
  };

  // Modelos únicos (sin duplicar por serie) para el buscador de modelo
  const equiposModeloFiltrados = [...new Map(equiposModeloSugeridos.map(eq => [eq.modelo, eq])).values()];

  // Registra el equipo del form OT en el mantenedor (la serie es opcional).
  // Se usa desde el botón "+ Registrar en Equipos" al crear o editar una OT.
  const registrarEquipoEnMantenedor = async () => {
    const { equipo, marca, modelo, serie } = nuevaOrden;
    try {
      const res = await api.post("/api/equipos", { equipo, marca, modelo, serie });
      alert(`Equipo creado en el mantenedor con código ${res.data.codigo}.`);
      const lista = await api.get("/api/equipos");
      setEquipos(lista.data);
    } catch (err) {
      alert(err.response?.data?.msg || "Error al registrar el equipo en el mantenedor.");
    }
  };

  return {
    equipos, setEquipos, fetchEquipos,
    busquedaModelo, setBusquedaModelo, mostrarDropdownModelo, setMostrarDropdownModelo,
    equiposModeloSugeridos, setEquiposModeloSugeridos, equiposModeloFiltrados, equipoModeloDropdownRef,
    seleccionarEquipoPorModelo, registrarEquipoEnMantenedor
  };
}
