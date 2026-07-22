export const toUpper = (v) => (v || "").toUpperCase();

export const validarRUT = (rut) => {
  if (!rut) return false;
  const limpio = rut.replace(/\./g, "").toUpperCase();
  const match = limpio.match(/^(\d+)-([K0-9])$/);
  if (!match) return false;
  const num = parseInt(match[1], 10);
  if (num < 100000) return false;
  const dv = match[2];
  let suma = 0, mul = 2;
  const digits = String(num).split("").reverse().join("");
  for (let i = 0; i < digits.length; i++) {
    suma += parseInt(digits[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (suma % 11);
  const esperado = res === 11 ? "0" : res === 10 ? "K" : String(res);
  return dv === esperado;
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
