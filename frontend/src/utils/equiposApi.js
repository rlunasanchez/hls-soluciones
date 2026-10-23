import api from "../services/api";

// ¿Existe en el mantenedor un equipo con este Equipo + Marca + Modelo (sin distinguir mayúsculas ni
// espacios)? Devuelve el equipo o null; sin conexión se trata como "no existe".
export async function verificarEquipo({ equipo = "", marca = "", modelo = "" } = {}, signal) {
  if (!String(equipo).trim()) return null;
  try {
    const { data } = await api.get("/api/equipos/verificar", { params: { equipo, marca, modelo }, signal });
    return data.equipo;
  } catch {
    return null;
  }
}
