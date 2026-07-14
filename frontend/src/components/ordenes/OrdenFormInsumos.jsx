import { Plus, Trash2 } from "lucide-react";

function OrdenFormInsumos({ insumos, insumosVisibles, setInsumosVisibles, setInsumos }) {
  const actualizarInsumo = (idx, valor) => {
    const nuevos = [...insumos];
    nuevos[idx].nombre = valor.toUpperCase();
    setInsumos(nuevos);
  };

  return (
    <div className="of-sec" style={{background:'white'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
        <span className="of-st muted">Insumos</span>
        {insumosVisibles < 12 && (
          <button type="button" className="of-btn-a" onClick={() => setInsumosVisibles(insumosVisibles + 1)}>
            <Plus size={14} /> Agregar
          </button>
        )}
      </div>
      <div className="of-ins">
        {insumos.slice(0, insumosVisibles).map((ins, idx) => (
          <div key={idx} className="of-ins-item">
            <div>
              <label>Insumo {idx + 1}</label>
              <input type="text" placeholder={`Insumo ${idx + 1}`} value={ins.nombre} onChange={(e) => actualizarInsumo(idx, e.target.value)} />
            </div>
            <button type="button" className="of-ins-del" onClick={() => {
              const nuevas = insumos.filter((_, i) => i !== idx);
              while (nuevas.length < 12) nuevas.push({ nombre: "" });
              setInsumos(nuevas);
              setInsumosVisibles(Math.max(2, insumosVisibles - 1));
            }}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrdenFormInsumos;
