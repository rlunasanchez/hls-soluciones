import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import api from "../../services/api";
import { upperInput, validarEmail } from "../../utils/helpers";
import CampoCatalogo from "../comunes/CampoCatalogo";
import ModalEditarCatalogo from "../comunes/ModalEditarCatalogo";
import BotonQuitar from "../comunes/BotonQuitar";

// Tabla propia de Contactos / Direcciones dentro de la ficha del Cliente.
// Los registros viven en sus mantenedores (catálogos globales); acá solo se
// buscan y se vinculan al cliente. Crear uno que ya existe NO da error: se
// reutiliza el existente (el backend responde con reutilizar: true).
const CONFIG = {
  contactos: {
    titulo: "Contactos",
    etiqueta: "Buscar Contacto",
    placeholder: "Buscar contacto por nombre, email, fono o cargo…",
    vacio: "Sin contactos vinculados",
    verbo: "contacto",
    mantenedor: "Contactos",
    columnas: [["Nombre", "nombre"], ["Cargo", "cargo"], ["Email", "email"], ["Fono", "fono"]],
    nuevo: { nombre: "", cargo: "", email: "", fono: "" },
  },
  direcciones: {
    titulo: "Direcciones",
    etiqueta: "Buscar Dirección",
    placeholder: "Buscar dirección, ciudad o comuna…",
    vacio: "Sin direcciones vinculadas",
    verbo: "dirección",
    mantenedor: "Direcciones",
    columnas: [["Dirección", "direccion"], ["Ciudad", "ciudad"], ["Comuna", "comuna"]],
    nuevo: { direccion: "", ciudad: "", comuna: "" },
  },
};

const soloLetras = (e) => upperInput(e).replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "");

function VinculosCliente({ tipo, vinculados, onChange, readOnly = false }) {
  const cfg = CONFIG[tipo];
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState(cfg.nuevo);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const yaVinculado = (id) => vinculados.some((v) => v.id === id);

  const vincular = (registro) => {
    if (!yaVinculado(registro.id)) onChange([...vinculados, registro]);
  };

  const desvincular = (id) => onChange(vinculados.filter((v) => v.id !== id));

  // Check "En la OT": uno por tabla. Marcar otro desmarca el anterior; volver a
  // marcar el mismo lo desmarca (ninguno marcado = la OT pregunta).
  const marcarEnOt = (id) => onChange(vinculados.map((v) => ({ ...v, a_ot: v.id === id && !v.a_ot ? 1 : 0 })));

  const crear = async () => {
    const campoPrincipal = tipo === "contactos" ? "nombre" : "direccion";
    const minimo = tipo === "contactos" ? 3 : 5;
    if ((nuevo[campoPrincipal] || "").trim().length < minimo) {
      alert(tipo === "contactos" ? "Ingrese el nombre completo del contacto (mínimo 3 caracteres)." : "Ingrese la dirección completa (mínimo 5 caracteres).");
      return;
    }
    if (tipo === "contactos" && nuevo.email.trim() && !validarEmail(nuevo.email)) {
      alert("Email inválido.");
      return;
    }
    setGuardando(true);
    try {
      const res = await api.post(`/api/${tipo}`, { ...nuevo, reutilizar: true });
      const registro = (await api.get(`/api/${tipo}/${res.data.id}`)).data;
      vincular(registro);
      setNuevo(cfg.nuevo);
      setCreando(false);
      if (res.data.existente) alert("Ya existía en el mantenedor: se vinculó el registro existente.");
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={`cf-sec cf-vinc cf-sec-${tipo}`}>
      <h3>{cfg.titulo}</h3>

      {!readOnly && (
        <>
          <CampoCatalogo
            tipo={tipo}
            etiqueta={cfg.etiqueta}
            placeholder={cfg.placeholder}
            excluirIds={vinculados.map((v) => v.id)}
            onElegir={vincular}
            accionExtra={(
              <button type="button" className="btn-mini btn-mini--success" onClick={() => setCreando(!creando)}>
                <Plus size={14} /> Nuevo
              </button>
            )}
          />
          {creando && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginTop: 8 }}>
              {tipo === "contactos" ? (
                <>
                  <input placeholder="Nombre *" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: soloLetras(e) })} />
                  <input placeholder="Cargo" value={nuevo.cargo} onChange={(e) => setNuevo({ ...nuevo, cargo: soloLetras(e) })} />
                  <input type="email" placeholder="Email" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} />
                  <input placeholder="Fono" value={nuevo.fono} onChange={(e) => setNuevo({ ...nuevo, fono: e.target.value.replace(/[^0-9+]/g, "") })} />
                </>
              ) : (
                <>
                  <input placeholder="Dirección *" value={nuevo.direccion} onChange={(e) => setNuevo({ ...nuevo, direccion: upperInput(e) })} />
                  <input placeholder="Ciudad" value={nuevo.ciudad} onChange={(e) => setNuevo({ ...nuevo, ciudad: soloLetras(e) })} />
                  <input placeholder="Comuna" value={nuevo.comuna} onChange={(e) => setNuevo({ ...nuevo, comuna: soloLetras(e) })} />
                </>
              )}
              <button type="button" className="btn-mini btn-mini--success" onClick={crear} disabled={guardando}>
                {guardando ? "Guardando..." : "Agregar"}
              </button>
            </div>
          )}

        </>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>N°</th>
              {cfg.columnas.map(([label]) => <th key={label}>{label}</th>)}
              <th title="El que tenga el check es el que se lleva a la OT">En la OT</th>
              {!readOnly && <th></th>}
            </tr>
          </thead>
          <tbody>
            {vinculados.length === 0 && (
              <tr><td colSpan={cfg.columnas.length + 3} className="cf-vacio" style={{ textAlign: "center", color: "#6b7280" }}>{cfg.vacio}</td></tr>
            )}
            {vinculados.map((v, i) => (
              <tr key={v.id}>
                <td data-label="N°">{i + 1}</td>
                {cfg.columnas.map(([label, campo]) => (
                  <td key={label} data-label={label}>
                    {v[campo]}
                  </td>
                ))}
                <td data-label="En la OT">
                  <input type="checkbox" checked={!!v.a_ot} disabled={readOnly} onChange={() => marcarEnOt(v.id)}
                    title="Llevar a la OT" style={{ cursor: readOnly ? "default" : "pointer", width: 16, height: 16 }} />
                </td>
                {!readOnly && (
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button type="button" className="btn-mini btn-mini--warning" title={`Editar este ${cfg.verbo}`} onClick={() => setEditando(v)}>
                        <Pencil size={14} /> Editar
                      </button>
                      <BotonQuitar onConfirmar={() => desvincular(v.id)} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editando && (
        <ModalEditarCatalogo tipo={tipo} registro={editando} onCerrar={() => setEditando(null)}
          onGuardado={(actualizado) => onChange(vinculados.map((x) => (x.id === actualizado.id ? { ...x, ...actualizado } : x)))} />
      )}
    </div>
  );
}

export default VinculosCliente;
