import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { MoreHorizontal, FileSpreadsheet, FileDown } from "lucide-react";

// Menú "..." con PDF y Cotización para usar dentro del formulario de la OT
// (una vez que la orden ya tiene id, es decir, se guardó al menos una vez).
function OrdenFormAcciones({ onPDF, onCotizacion }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (btnRef.current && btnRef.current.contains(event.target)) return;
      if (menuRef.current && menuRef.current.contains(event.target)) return;
      setAbierto(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!abierto || !btnRef.current || !menuRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const left = Math.min(Math.max(rect.right - 140, 4), window.innerWidth - 140);
    let top = rect.bottom + 4;
    if (top + menuHeight > window.innerHeight) {
      top = Math.max(rect.top - menuHeight - 4, 4);
    }
    setPos({ top, left });
  }, [abierto]);

  const toggle = (e) => {
    e.stopPropagation();
    setAbierto((v) => !v);
  };

  return (
    <div className="acciones-menu" style={{ position: "relative" }}>
      <button
        type="button"
        ref={btnRef}
        className="of-btn-c"
        onClick={toggle}
        aria-label="Más acciones"
      >
        <MoreHorizontal size={16} /> Más
      </button>
      {abierto && (
        <div className="acciones-dropdown" ref={menuRef} style={{ position: "fixed", top: pos.top, left: pos.left }}>
          <button className="acciones-item cotizacion" onClick={() => { setAbierto(false); onCotizacion(); }}>
            <FileSpreadsheet size={14} /> Cotización
          </button>
          <button className="acciones-item pdf" onClick={() => { setAbierto(false); onPDF(); }}>
            <FileDown size={14} /> PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default OrdenFormAcciones;
