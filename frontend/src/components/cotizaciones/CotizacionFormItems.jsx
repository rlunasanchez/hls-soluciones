import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { upperInput } from "../../utils/helpers";
import { calcularTotales } from "../../utils/cotizacionDoc";
import { itemVacio } from "../../utils/cotizacionFormato";

const clp = (n) => Math.round(Number(n) || 0).toLocaleString("es-CL");
const soloDigitos = (v) => String(v || "").replace(/[^0-9]/g, "");
const clpInput = (v) => {
  const digitos = soloDigitos(v);
  return digitos ? Number(digitos).toLocaleString("es-CL") : "";
};

// El primer ítem siempre se ve completo; con más de uno se puede plegar la lista.
const LIMITE_ITEMS = 1;

const estiloBotonLinea = (color) => ({
  display: "inline-flex", alignItems: "center", gap: 4,
  background: "none", color, border: `1px solid ${color}`,
  borderRadius: "6px", padding: "3px 12px", cursor: "pointer",
  fontWeight: 600, fontSize: "0.75rem"
});

function ItemCard({ item, idx, soloLectura, actualizar, quitar }) {
  const bruto = (Number(item.cantidad) || 0) * (Number(item.neto) || 0);
  const descuentoPct = Math.min(100, Math.max(0, Number(item.descuento) || 0));
  const totalFila = Math.max(0, bruto * (1 - descuentoPct / 100));
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px 8px", marginBottom: 8, background: "#fff" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8, alignItems: "flex-end" }}>
        {/* Solo el número del ítem, al lado del SKU */}
        <span style={{ flex: "0 0 18px", alignSelf: "flex-end", paddingBottom: 4, textAlign: "center", fontSize: ".8rem", fontWeight: 700, color: "var(--primary)" }}>
          {idx + 1}
        </span>
        <div className="of-f" style={{ flex: "0 0 70px" }}>
          <label>SKU</label>
          <input type="text" value={item.sku} onChange={(e) => actualizar(idx, "sku", e.target.value)} disabled={soloLectura} />
        </div>
        <div className="of-f" style={{ flex: "1 1 200px" }}>
          <label>Detalle</label>
          <textarea rows={1} value={item.detalle} onChange={(e) => actualizar(idx, "detalle", upperInput(e))} disabled={soloLectura}
            style={{ resize: "vertical", fontFamily: "inherit", minHeight: 0, height: 40 }} />
        </div>
        <div className="of-f" style={{ flex: "0 0 55px" }}>
          <label>Cant.</label>
          <input type="number" min="0" value={item.cantidad} onChange={(e) => actualizar(idx, "cantidad", e.target.value)} disabled={soloLectura} />
        </div>
        <div className="of-f" style={{ flex: "0 0 78px" }}>
          <label>Neto</label>
          <input type="text" inputMode="numeric" value={clpInput(item.neto)} onChange={(e) => actualizar(idx, "neto", soloDigitos(e.target.value))} disabled={soloLectura} />
        </div>
        <div className="of-f" style={{ flex: "0 0 78px", position: "relative" }}>
          <label>Descuento</label>
          <input
            type="text"
            inputMode="numeric"
            value={item.descuento}
            onChange={(e) => {
              let d = soloDigitos(e.target.value);
              if (d && Number(d) > 100) d = "100";
              actualizar(idx, "descuento", d);
            }}
            disabled={soloLectura}
            style={{ paddingRight: 16 }}
          />
          {item.descuento && (
            <span style={{ position: "absolute", right: 6, bottom: 5, fontSize: ".75rem", color: "var(--text-muted)", pointerEvents: "none" }}>%</span>
          )}
        </div>
        <div className="of-f" style={{ flex: "0 0 78px" }}>
          <label>Total</label>
          <input type="text" value={clp(totalFila)} disabled />
        </div>
        {!soloLectura && (
          <button type="button" onClick={() => quitar(idx)} title="Quitar ítem"
            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: 6, padding: "4px 7px", cursor: "pointer", display: "flex", alignSelf: "flex-end", marginBottom: 2 }}>
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// Sección "Ítems" de la cotización: lista de ítems (agregar, quitar, plegar) y totales.
function CotizacionFormItems({ cotizacion, setCotizacion, soloLectura }) {
  const [colapsado, setColapsado] = useState(false);
  const { items } = cotizacion;
  const totales = calcularTotales(items);

  const actualizar = (idx, campo, valor) => {
    setCotizacion((prev) => {
      const nuevos = [...prev.items];
      nuevos[idx] = { ...nuevos[idx], [campo]: valor };
      return { ...prev, items: nuevos };
    });
  };
  const agregar = () => {
    setCotizacion((prev) => ({ ...prev, items: [...prev.items, itemVacio()] }));
    setColapsado(false);
  };
  const quitar = (idx) => {
    if (!window.confirm(`¿Eliminar el Ítem ${idx + 1}?`)) return;
    setCotizacion((prev) => {
      const restantes = prev.items.filter((_, i) => i !== idx);
      // Nunca dejar la lista vacía: el formulario siempre muestra el Ítem 1.
      return { ...prev, items: restantes.length ? restantes : [itemVacio()] };
    });
    if (items.length - 1 <= LIMITE_ITEMS) setColapsado(false);
  };

  const visibles = colapsado ? items.slice(0, 1) : items;

  return (
    <div className="of-sec primary">
      <div className="of-st primary">Ítems</div>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
        marginTop: 6, marginBottom: 10, padding: "8px 10px",
        background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "8px"
      }}>
        {!soloLectura && (
          <button type="button" onClick={agregar} style={estiloBotonLinea("var(--success)")}>
            <Plus size={14} /> Agregar ítem
          </button>
        )}
        {items.length > LIMITE_ITEMS && (
          <button type="button" onClick={() => setColapsado((v) => !v)} style={estiloBotonLinea("var(--primary)")}>
            {colapsado ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            {colapsado ? "Ver más" : "Ver menos"}
          </button>
        )}
      </div>

      {visibles.map((item, idx) => (
        <ItemCard key={idx} item={item} idx={idx} soloLectura={soloLectura} actualizar={actualizar} quitar={quitar} />
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <div style={{ minWidth: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: ".85rem" }}>
            <span>Neto:</span><span>{clp(totales.neto)} CLP</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: ".85rem" }}>
            <span>IVA (19%):</span><span>{clp(totales.iva)} CLP</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "1rem", fontWeight: 800, color: "var(--primary)", borderTop: "1px solid var(--border)", marginTop: 4 }}>
            <span>Total:</span><span>{clp(totales.total)} CLP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CotizacionFormItems;
