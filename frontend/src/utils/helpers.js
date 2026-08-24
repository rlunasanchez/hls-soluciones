export const toUpper = (v) => (v || "").toUpperCase();

// Aplica transformación (mayúsculas + regex opcional) directamente en el input
// y restaura el caret para evitar que React lo mueva al final.
export const upperInput = (e, regex) => {
  const el = e.target;
  let val = String(el.value || "").toUpperCase();
  if (regex) val = val.replace(regex, "");
  if (el.value !== val) {
    el.value = val;
    // selection API no existe en inputs type="email"/number/date: sin try/catch el
    // onChange lanzaría y el input controlado congelaría lo tecleado
    try {
      const pos = el.selectionStart;
      el.setSelectionRange(Math.min(pos ?? val.length, val.length), Math.min(pos ?? val.length, val.length));
    } catch { /* tipos sin selección */ }
  }
  return val;
};

// Calcula el dígito verificador (módulo 11) de un RUT chileno
export const calcularDV = (cuerpo) => {
  let suma = 0, mul = 2;
  const digitos = String(cuerpo).split("").reverse().join("");
  for (let i = 0; i < digitos.length; i++) {
    suma += parseInt(digitos[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (suma % 11);
  return res === 11 ? "0" : res === 10 ? "K" : String(res);
};

// Normaliza un RUT para comparaciones de unicidad: solo dígitos + K en mayúscula.
// Ignora puntos, guiones, espacios y el caso del DV: "12.345.678-k", "12345678-K" y
// "12345678k" quedan como "12345678K"
export const normalizarRut = (v) =>
  String(v || "").toUpperCase().replace(/[^0-9K]/g, "");

// Valida formato básico de email: texto@texto.texto (vacío es válido, se valida aparte)
export const validarEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

export const validarRUT = (rut) => {
  if (!rut) return false;
  const limpio = rut.replace(/\./g, "").toUpperCase();
  const match = limpio.match(/^(\d+)-([K0-9])$/);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  if (num < 100000) return false;
  return match[2] === calcularDV(num);
};

// Formatea progresivamente un RUT con puntos mientras se escribe (igual que el formulario
// de nuevo cliente): el usuario escribe números/K/guion y los puntos se agregan solos
export const formatearRutInput = (valor) => {
  let v = (valor || "").toUpperCase().replace(/[^0-9K-]/g, "");
  if (v.length > 12) v = v.slice(0, 12);
  const partes = v.split("-");
  if (partes.length === 2) {
    if (partes[1].length > 1) partes[1] = partes[1][0];
    if (partes[0].length > 0)
      partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  } else if (partes.length === 1 && partes[0].length > 0) {
    partes[0] = partes[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  }
  return partes.join("-");
};

export const parseToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return { usuario: "Usuario", rol: "tecnico" };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { usuario: payload.usuario, rol: payload.rol || "tecnico" };
  } catch {
    return { usuario: "Usuario", rol: "tecnico" };
  }
};

export const cerrarSesion = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};
