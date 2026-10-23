import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import { toUpper } from "../utils/helpers";
import useClicFuera from "./useClicFuera";
import useEquipoExistente from "./useEquipoExistente";

// Equipos de la OT: si el equipo escrito ya está en el mantenedor, buscador por modelo con sus
// sugerencias, elegir un equipo (solo copia equipo/marca/modelo, la serie se borra) y registrar el de la
// OT en el mantenedor. Ya no se carga la lista completa de equipos: se consulta al servidor.
export default function useEquiposOT({ nuevaOrden, setNuevaOrden }) {
  const [busquedaModelo, setBusquedaModelo] = useState("");
  const [mostrarDropdownModelo, setMostrarDropdownModelo] = useState(false);
  const [equiposModeloSugeridos, setEquiposModeloSugeridos] = useState([]);
  const equipoModeloDropdownRef = useRef(null);

  // Equipo del mantenedor que coincide con el escrito en la OT (o null)
  const [equipoExistente, refrescarEquipo] = useEquipoExistente(nuevaOrden);

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
    refrescarEquipo(equipo);   // ya sabemos que existe: los campos se bloquean sin esperar
  };

  // Sugerencias del buscador de modelo, sin repetir el mismo Equipo + Marca + Modelo (así se identifica un equipo)
  const clave = (eq) => [eq.equipo, eq.marca, eq.modelo].map((v) => String(v || "").trim().toLowerCase()).join("|");
  const equiposModeloFiltrados = [...new Map(equiposModeloSugeridos.map((eq) => [clave(eq), eq])).values()];

  // Registra el equipo del form OT en el mantenedor (la serie es opcional).
  // Se usa desde el botón "+ Registrar en Equipos" al crear o editar una OT.
  const registrarEquipoEnMantenedor = async () => {
    const { equipo, marca, modelo, serie } = nuevaOrden;
    try {
      const res = await api.post("/api/equipos", { equipo, marca, modelo, serie });
      alert(`Equipo creado en el mantenedor con código ${res.data.codigo}.`);
      refrescarEquipo({ equipo, marca, modelo, serie: serie || null, codigo: res.data.codigo });
    } catch (err) {
      alert(err.response?.data?.msg || "Error al registrar el equipo en el mantenedor.");
    }
  };

  return {
    equipoExistente, refrescarEquipo,
    busquedaModelo, setBusquedaModelo, mostrarDropdownModelo, setMostrarDropdownModelo,
    equiposModeloSugeridos, setEquiposModeloSugeridos, equiposModeloFiltrados, equipoModeloDropdownRef,
    seleccionarEquipoPorModelo, registrarEquipoEnMantenedor
  };
}
