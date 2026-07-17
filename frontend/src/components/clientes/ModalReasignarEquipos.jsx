import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import api from "../../services/api";

function ModalReasignarEquipos({ equipos, clientes, clienteId, onConfirm, onCancel }) {
  const [asignaciones, setAsignaciones] = useState(
    equipos.reduce((acc, eq) => ({ ...acc, [eq.id]: "" }), {})
  );
  const [procesando, setProcesando] = useState(false);

  const clientesDisponibles = clientes.filter((c) => c.id !== clienteId);

  const handleChange = (equipoId, nuevoClienteId) => {
    setAsignaciones((prev) => ({ ...prev, [equipoId]: nuevoClienteId }));
  };

  const todosAsignados = equipos.every((eq) => asignaciones[eq.id]);

  const handleReasignar = async () => {
    setProcesando(true);
    try {
      for (const eq of equipos) {
        await api.put(`/api/equipos/${eq.id}/reasignar`, {
          nuevo_cliente_id: parseInt(asignaciones[eq.id]),
        });
      }
      onConfirm();
    } catch (err) {
      alert("Error al reasignar equipos");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          background: "white", borderRadius: "12px", padding: "24px",
          width: "100%", maxWidth: "550px", maxHeight: "80vh", overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{
            background: "#FEF3C7", borderRadius: "50%", width: "36px", height: "36px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertTriangle size={20} style={{ color: "#F59E0B" }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text)" }}>
              Este cliente tiene {equipos.length} equipo{equipos.length > 1 ? "s" : ""}
            </h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Asigná cada equipo a otro cliente antes de eliminar
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          {equipos.map((eq) => (
            <div
              key={eq.id}
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px",
                padding: "10px", border: "1px solid var(--border)", borderRadius: "8px",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text)" }}>
                  {eq.codigo} — {eq.equipo}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {eq.marca} {eq.modelo} | Serie: {eq.serie || "N/A"}
                </div>
              </div>
              <select
                value={asignaciones[eq.id]}
                onChange={(e) => handleChange(eq.id, e.target.value)}
                style={{
                  padding: "6px 8px", border: "2px solid var(--border)", borderRadius: "6px",
                  fontSize: "0.8rem", background: "white",
                }}
              >
                <option value="">Seleccionar cliente...</option>
                {clientesDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>{c.razon_social}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button" onClick={onCancel}
            style={{
              padding: "8px 16px", border: "2px solid var(--border)", borderRadius: "6px",
              background: "white", cursor: "pointer", fontWeight: 500, fontSize: "0.85rem",
            }}
          >
            Cancelar
          </button>
          <button
            type="button" onClick={handleReasignar}
            disabled={!todosAsignados || procesando}
            style={{
              padding: "8px 16px", border: "none", borderRadius: "6px",
              background: todosAsignados && !procesando ? "var(--primary)" : "#ccc",
              color: "white", cursor: todosAsignados && !procesando ? "pointer" : "not-allowed",
              fontWeight: 500, fontSize: "0.85rem",
            }}
          >
            {procesando ? "Reasignando..." : "Reasignar y Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalReasignarEquipos;
