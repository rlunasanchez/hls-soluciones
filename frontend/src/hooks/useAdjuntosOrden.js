import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import {
  LIMITES, esImagen, esPdf, dataUrlDe, validarArchivoNuevo, prepararArchivo, prepararAntiguo
} from "../utils/adjuntos";

const SIN_ANTIGUOS = [];   // referencia fija: una lista nueva en cada render repetiría el efecto de carga

// Adjuntos de la OT abierta en el formulario. Los archivos viven en el servidor (tabla orden_adjuntos),
// aparte de la OT: se suben y se borran de a uno y guardar la OT no los vuelve a enviar.
//  - OT guardada: cada archivo se sube al elegirlo y se borra al eliminarlo.
//  - OT nueva: quedan en memoria (pendientes) y se suben con `subirPendientes(id)` al guardar la OT.
//  - Adjuntos antiguos (JSON base64 en la propia OT): se pasan a la tabla al abrir la OT en Editar
//    (`alMigrar` los saca del formulario); en modo Ver se muestran tal cual.
// Cada elemento de `items`: { id, kind: "guardado" | "pendiente" | "antiguo", nombre, tipo, tamano, miniatura }.
export default function useAdjuntosOrden({ ordenId, activo, soloLectura, antiguos = SIN_ANTIGUOS, alMigrar }) {
  const [guardados, setGuardados] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [ocupado, setOcupado] = useState(false);
  const pendientesRef = useRef([]);
  pendientesRef.current = pendientes;

  // Carga de los adjuntos de la orden (y migración de los antiguos al abrirla en Editar)
  useEffect(() => {
    if (!activo || !ordenId) { setGuardados([]); return undefined; }
    let vivo = true;
    const cargar = () => api.get("/api/adjuntos", { params: { orden_id: ordenId } }).then((r) => r.data);
    (async () => {
      try {
        let lista = await cargar();
        const porMigrar = soloLectura ? [] : antiguos.filter((a) => a?.data && a?.tipo && !lista.some((g) => g.nombre === a.nombre && g.tipo === a.tipo));
        if (!soloLectura && antiguos.length > 0) {
          setOcupado(true);
          for (const a of porMigrar) await api.post("/api/adjuntos", { orden_id: ordenId, ...(await prepararAntiguo(a)) });
          await api.post("/api/adjuntos/migrado", { orden_id: ordenId });
          if (alMigrar) alMigrar();
          lista = await cargar();
        }
        if (vivo) setGuardados(lista);
      } catch (err) {
        console.error("Error al cargar los adjuntos:", err);
      } finally {
        if (vivo) setOcupado(false);
      }
    })();
    return () => { vivo = false; };
  }, [activo, ordenId, soloLectura, antiguos]);

  // Al cerrar el formulario se descartan los pendientes
  useEffect(() => { if (!activo) setPendientes([]); }, [activo]);

  // Los antiguos que todavía no están en la tabla se muestran desde la propia OT
  const antiguosVisibles = antiguos
    .filter((a) => a?.data && a?.tipo && !guardados.some((g) => g.nombre === a.nombre && g.tipo === a.tipo))
    .map((a, i) => ({ id: `antiguo-${i}`, kind: "antiguo", nombre: a.nombre || "archivo", tipo: a.tipo, tamano: Math.floor((a.data.length * 3) / 4), miniatura: null, data: a.data }));
  const items = [
    ...guardados.map((g) => ({ ...g, kind: "guardado" })),
    ...pendientes,
    ...antiguosVisibles
  ];

  const cuenta = {
    imagenes: items.filter((i) => esImagen(i.tipo)).length,
    pdfs: items.filter((i) => esPdf(i.tipo)).length
  };
  const puedeAgregar = !soloLectura && (cuenta.imagenes < LIMITES.maxImagenes || cuenta.pdfs < LIMITES.maxPdfs);

  // Agrega archivos elegidos (varios a la vez): valida, reduce las imágenes grandes y los sube (o los deja pendientes)
  const agregar = async (archivos) => {
    const errores = [];
    const acumulado = items.map(({ tipo, tamano }) => ({ tipo, tamano }));
    setOcupado(true);
    try {
      for (const file of Array.from(archivos)) {
        const problema = validarArchivoNuevo(file, acumulado);
        if (problema) { errores.push(problema); continue; }
        try {
          const p = await prepararArchivo(file);
          const suma = acumulado.reduce((s, a) => s + a.tamano, 0) + p.tamano;
          if (esImagen(p.tipo) && p.tamano > LIMITES.maxBytesImagen) { errores.push(`"${file.name}": la imagen supera el máximo de 5 MB incluso reducida.`); continue; }
          if (suma > LIMITES.maxBytesTotal) { errores.push(`"${file.name}": los adjuntos de la orden no pueden pasar de 60 MB en total.`); continue; }
          if (ordenId) {
            const { data } = await api.post("/api/adjuntos", { orden_id: ordenId, nombre: p.nombre, tipo: p.tipo, base64: p.base64, miniatura: p.miniatura });
            setGuardados((prev) => [...prev, data]);
          } else {
            setPendientes((prev) => [...prev, { ...p, id: `pendiente-${Date.now()}-${prev.length}`, kind: "pendiente" }]);
          }
          acumulado.push({ tipo: p.tipo, tamano: p.tamano });
        } catch (err) {
          errores.push(`"${file.name}": ${err.response?.data?.msg || err.message || "no se pudo subir."}`);
        }
      }
    } finally {
      setOcupado(false);
    }
    if (errores.length > 0) alert(errores.join("\n"));
  };

  const eliminar = async (item) => {
    if (item.kind === "pendiente") { setPendientes((prev) => prev.filter((p) => p.id !== item.id)); return; }
    if (item.kind !== "guardado") return;
    try {
      await api.delete(`/api/adjuntos/${item.id}`);
      setGuardados((prev) => prev.filter((g) => g.id !== item.id));
    } catch (err) {
      alert(err.response?.data?.msg || "No se pudo eliminar el archivo.");
    }
  };

  // Sube los archivos de una OT nueva a la orden recién creada. Devuelve los mensajes de los que fallaron.
  const subirPendientes = async (idNuevo) => {
    const fallos = [];
    for (const p of pendientesRef.current) {
      try {
        await api.post("/api/adjuntos", { orden_id: idNuevo, nombre: p.nombre, tipo: p.tipo, base64: p.base64, miniatura: p.miniatura });
      } catch (err) {
        fallos.push(`${p.nombre}: ${err.response?.data?.msg || "no se pudo subir."}`);
      }
    }
    setPendientes([]);
    return fallos;
  };

  // Dirección para ver/descargar un archivo: { url, liberar }. Los del servidor se bajan al pedirlos.
  const urlDe = async (item) => {
    if (item.kind !== "guardado") return { url: dataUrlDe(item), liberar: () => {} };
    const res = await api.get(`/api/adjuntos/${item.id}/archivo`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    return { url, liberar: () => URL.revokeObjectURL(url) };
  };

  return { items, cuenta, ocupado, puedeAgregar, soloLectura, agregar, eliminar, subirPendientes, urlDe };
}
