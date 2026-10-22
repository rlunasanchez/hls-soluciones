// Validaciones de cliente (RUT chileno y email). Idéntico en `main` (MySQL) y `deploy/cloud` (PostgreSQL).

// Normaliza un RUT para comparar unicidad: solo dígitos y K en mayúscula.
// "12.345.678-k", "12345678-K" y "12345678k" quedan como "12345678K"
export function normalizarRut(v) {
  return String(v || "").toUpperCase().replace(/[^0-9K]/g, "");
}

// Valida formato y dígito verificador (módulo 11) de un RUT chileno
export function validarRutChileno(rut) {
  const norm = normalizarRut(rut);
  const m = norm.match(/^(\d{6,8})([0-9K])$/);
  if (!m) return false;
  const cuerpo = parseInt(m[1], 10);
  if (cuerpo < 100000) return false;
  let suma = 0, mul = 2;
  for (const d of m[1].split("").reverse()) {
    suma += parseInt(d, 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (suma % 11);
  const dv = res === 11 ? "0" : res === 10 ? "K" : String(res);
  return m[2] === dv;
}

// Valida formato básico de email: texto@texto.texto (vacío es válido, se valida aparte)
export function validarEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

// Sin parámetros: todos los clientes (listado de Clientes). Con ?q=texto (2+ caracteres): solo los
// que coinciden, hasta ?limite= (por defecto 10), ya con su contacto y dirección de la OT.
