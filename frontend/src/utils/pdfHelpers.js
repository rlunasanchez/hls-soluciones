// Funciones auxiliares comunes a los PDF (Orden de Servicio y Cotización). Son puras: devuelven HTML en texto.

// Los valores son texto libre escrito por el usuario y se inyectan con doc.write():
// un "&", "<" o '"' sin escapar rompe el documento.
export const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]
));

// Recorta el string ISO en vez de pasar por new Date()/toLocaleDateString()
// para no arriesgar un corrimiento de día por huso horario.
export const fecha = (v) => {
  const [y, m, d] = String(v ?? "").substring(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
};

// Campo de la grilla "label arriba, valor abajo". Si no hay valor, no se
// imprime nada: así los campos vacíos desaparecen solos y la grilla se recompone.
export const campo = (label, valor, numerico = false) => (
  valor ? `<div class="f"><span class="l">${esc(label)}</span><span class="v${numerico ? " num" : ""}">${esc(valor)}</span></div>` : ""
);

export const h2 = (titulo, extraHtml = "") => (
  `<h2><span>${esc(titulo)}</span>${extraHtml ? `<span class="h2-extra">${extraHtml}</span>` : ""}</h2>`
);

export const slotLogo = (src, alt, cls) => (
  src
    ? `<img class="logo ${cls}" src="${src}" alt="${esc(alt)}">`
    : `<div class="logo ${cls} logo--ph">${esc(alt)}</div>`
);

// Une las partes con texto con un separador (por ejemplo "Ciudad - Comuna").
export const unir = (partes, separador) => partes.filter((v) => String(v || "").trim()).join(separador);
