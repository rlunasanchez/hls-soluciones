// Fechas guardadas por el servidor (ISO) mostradas en hora de Chile, formato 23-10-2026 y 23-10-2026 14:35.
const ZONA = "America/Santiago";

const partes = (valor, opciones) => {
  const fecha = new Date(valor);
  if (!valor || isNaN(fecha.getTime())) return null;
  return new Intl.DateTimeFormat("es-CL", { timeZone: ZONA, ...opciones }).format(fecha);
};

export const fechaCL = (valor) => partes(valor, { day: "2-digit", month: "2-digit", year: "numeric" }) || "";

export const fechaHoraCL = (valor) => {
  const dia = fechaCL(valor);
  const hora = partes(valor, { hour: "2-digit", minute: "2-digit", hour12: false });
  return dia && hora ? `${dia} ${hora}` : dia;
};
