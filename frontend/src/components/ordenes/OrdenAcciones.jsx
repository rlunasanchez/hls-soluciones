import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, FileText, FileSpreadsheet, Eye, Edit, Trash2 } from "lucide-react";

function OrdenAcciones({ orden, onVer, onEditar, onEliminar, onInforme, onCotizacion }) {
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

  const toggle = (e) => {
    e.stopPropagation();
    if (abierto) {
      setAbierto(false);
      return;
    }
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.right - 140 });
    setAbierto(true);
  };

  return (
    <div className="acciones-menu" style={{ position: "relative" }}>
      <button
        type="button"
        ref={btnRef}
        className="acciones-menu-btn"
        onClick={toggle}
        aria-label="Acciones"
      >
        <MoreHorizontal size={16} />
      </button>
      {abierto && (
        <div className="acciones-dropdown" ref={menuRef} style={{ position: "fixed", top: pos.top, left: pos.left }}>
          <button className="acciones-item informe" onClick={() => { setAbierto(false); onInforme(orden); }}>
            <FileText size={14} /> Informe
          </button>
          <button className="acciones-item cotizacion" onClick={() => { setAbierto(false); onCotizacion(orden); }}>
            <FileSpreadsheet size={14} /> Cotización
          </button>
          <button className="acciones-item ver" onClick={() => { setAbierto(false); onVer(orden); }}>
            <Eye size={14} /> Ver
          </button>
          <button className="acciones-item edit" onClick={() => { setAbierto(false); onEditar(orden); }}>
            <Edit size={14} /> Editar
          </button>
          <button className="acciones-item delete" onClick={() => { setAbierto(false); onEliminar(orden.id); }}>
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

export default OrdenAcciones;
