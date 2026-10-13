import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "../../styles/botones.css";

// Botón X para sacar un elemento de una lista sin eliminarlo de su mantenedor.
// Al hacer clic abre un aviso corto que pide confirmar; solo el botón de confirmar ejecuta la acción.
// El aviso se dibuja en el body: las tablas con scroll lo recortarían si fuera hijo del botón.
function BotonQuitar({ onConfirmar, titulo = "¿Realmente desea quitarlo?", detalle = null, confirmar = "Quitar" }) {
  const [pos, setPos] = useState(null);
  const boton = useRef(null);
  const aviso = useRef(null);

  const abrir = () => {
    const r = boton.current.getBoundingClientRect();
    // el aviso mide como máximo 260 px: se mantiene dentro de la pantalla
    const x = Math.min(Math.max(r.left + r.width / 2, 138), window.innerWidth - 138);
    setPos({ x, y: r.bottom, flecha: r.left + r.width / 2 - x });
  };
  const cerrar = () => setPos(null);

  useEffect(() => {
    if (!pos) return undefined;
    const fuera = (e) => {
      if (!aviso.current?.contains(e.target) && !boton.current?.contains(e.target)) cerrar();
    };
    const tecla = (e) => { if (e.key === "Escape") { cerrar(); boton.current?.focus(); } };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [pos]);

  return (
    <>
      <button ref={boton} type="button" className="btn-quitar" onClick={() => (pos ? cerrar() : abrir())}
        aria-label={titulo} aria-expanded={!!pos}>
        <X size={14} />
      </button>
      {pos && createPortal(
        <div ref={aviso} role="alertdialog" aria-label={titulo} className="quitar-aviso"
          style={{ left: pos.x, top: pos.y, "--flecha": `${pos.flecha}px` }}>
          <strong>{titulo}</strong>
          {detalle && <span>{detalle}</span>}
          <div className="quitar-aviso-botones">
            <button type="button" className="btn-mini btn-mini--neutro" onClick={cerrar}>Cancelar</button>
            <button type="button" className="btn-mini btn-mini--principal" autoFocus onClick={() => { cerrar(); onConfirmar(); }}>{confirmar}</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default BotonQuitar;
