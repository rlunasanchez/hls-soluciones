// Imprime un documento HTML completo (independiente del CSS de la app) en un
// iframe oculto, igual que imprimirAdjunto() en OrdenFormCliente.jsx, pero
// reutilizable: recibe el HTML ya armado en vez de un adjunto puntual.
export function imprimirHtml(html, titulo = "Documento") {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);

  const tituloApp = document.title;
  let limpiado = false;
  const limpiar = () => {
    if (limpiado) return;
    limpiado = true;
    document.title = tituloApp;
    if (frame.parentNode) frame.parentNode.removeChild(frame);
  };

  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) return limpiar();
    // Cambia el título mientras se imprime: es lo que el navegador sugiere
    // como nombre de archivo al elegir "Guardar como PDF".
    document.title = titulo;
    win.addEventListener("afterprint", limpiar);
    win.focus();
    win.print();
    // Respaldo: algunos navegadores (Safari) no siempre emiten "afterprint".
    setTimeout(limpiar, 60000);
  };

  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}
