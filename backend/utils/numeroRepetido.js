// ¿El error de la base es "el número de OT ya existe"? Pasa cuando dos guardados simultáneos calculan el
// mismo "último + 1". Sirve para MySQL (ER_DUP_ENTRY) y PostgreSQL (23505); el archivo es el mismo en las
// dos ramas.
export const esNumeroRepetido = (err) => (
  (err?.code === "ER_DUP_ENTRY" && /numero_orden/.test(err.message || ""))
  || (err?.code === "23505" && /numero_orden/.test(`${err.constraint || ""} ${err.detail || ""}`))
);
