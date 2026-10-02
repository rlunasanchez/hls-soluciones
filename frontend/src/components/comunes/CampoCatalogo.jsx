import { useState, useRef, useEffect } from "react";
import { Search, Pencil, UserPlus, MapPin } from "lucide-react";
import api from "../../services/api";
import useBusquedaApi from "../../hooks/useBusquedaApi";
import ModalEditarCatalogo from "./ModalEditarCatalogo";
import "../../styles/campo-catalogo.css";
import "../../styles/botones.css";

const norm = (s) => String(s || "").toUpperCase().trim();

// Lo único que cambia entre contactos y direcciones.
const CONFIG = {
  contactos: {
    minExiste: 3,
    Icono: UserPlus,
    clave: (r) => norm(r.nombre),
    busqueda: (r) => `${norm(r.nombre)} ${norm(r.email)}`,
    titulo: (r) => r.nombre,
    detalle: (r) => `${r.email ? `✉ ${r.email}` : ""}${r.fono ? ` | Tel: ${r.fono}` : ""}${r.cargo ? ` | ${r.cargo}` : ""}`,
    vacio: "No se encontraron contactos",
    verbo: "contacto", yaEstaba: "Ese contacto ya estaba en el mantenedor.", registrado: "Contacto registrado en el mantenedor de Contactos.",
    mantenedor: "Contactos",
  },
  direcciones: {
    minExiste: 5,
    Icono: MapPin,
    clave: (r) => norm(r.direccion),
    busqueda: (r) => `${norm(r.direccion)} ${norm(r.ciudad)} ${norm(r.comuna)}`,
    titulo: (r) => r.direccion,
    detalle: (r) => [r.ciudad, r.comuna].filter(Boolean).join(" | "),
    vacio: "No se encontraron direcciones",
    verbo: "dirección", yaEstaba: "Esa dirección ya estaba en el mantenedor.", registrado: "Dirección registrada en el mantenedor de Direcciones.",
    mantenedor: "Direcciones",
  },
};

// Buscador de un catálogo (Contactos o Direcciones) para elegir lo que lleva una OT.
//  - Lista primero lo del cliente (deCliente) y luego el resto del catálogo.
//  - Al elegir, llama onElegir y se vacía (los datos quedan en los campos de abajo).
//  - Si lo que tiene la OT (actual) existe en el catálogo: botón Editar (abre su ficha);
//    si lo escribieron a mano y no existe: botón Registrar.
// Para reiniciarlo al cambiar de cliente, el padre le pasa una key distinta.
// En la ficha del cliente se usa para vincular: excluirIds oculta lo ya vinculado y accionExtra
// agrega un botón al lado ("Nuevo").
function CampoCatalogo({ tipo, etiqueta, placeholder, deCliente = [], actual, datosRegistro, onElegir, onActualizado = () => {}, excluirIds = [], accionExtra = null, readOnly = false }) {
  const cfg = CONFIG[tipo];
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const caja = useRef(null);
  const [resultados] = useBusquedaApi(`/api/${tipo}`, texto);
  const [existentes, recargar] = useBusquedaApi(`/api/${tipo}`, actual, { min: cfg.minExiste, espera: 300 });

  useEffect(() => {
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) { setAbierto(false); setTexto(""); } };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  const q = norm(texto);
  const claveActual = norm(actual);
  // undefined = comprobando / sin datos suficientes, null = no existe, objeto = existe
  const enCatalogo = claveActual.length >= cfg.minExiste && existentes
    ? (existentes.find((r) => cfg.clave(r) === claveActual) || null)
    : undefined;

  const propios = deCliente.filter((r) => !q || cfg.busqueda(r).includes(q));
  const yaEstan = new Set(deCliente.map(cfg.clave));
  const opciones = q.length < 2 ? propios : [
    ...propios,
    ...(resultados || []).filter((r) => !yaEstan.has(cfg.clave(r)) && !excluirIds.includes(r.id)).map((r) => ({ ...r, delCatalogo: true })),
  ];
  const sinResultados = q.length >= 2 && resultados !== null && opciones.length === 0;

  // Se despliega con la lista del cliente (o el catálogo si ya escribió algo)
  const abrir = () => { if (deCliente.length > 0 || q.length >= 2) setAbierto(true); };

  const elegir = ({ delCatalogo: _delCatalogo, ...registro }) => { onElegir(registro); setTexto(""); setAbierto(false); };

  const registrar = async () => {
    try {
      const res = await api.post(`/api/${tipo}`, { ...datosRegistro, reutilizar: true });
      alert(res.data.existente ? cfg.yaEstaba : cfg.registrado);
      recargar();
    } catch (err) { alert(err.response?.data?.msg || `Error al registrar el ${cfg.verbo}.`); }
  };

  const Icono = cfg.Icono;

  return (
    <div ref={caja} className="of-f bc-caja">
      <label className="bc-etiqueta"><Search size={11} />{etiqueta}</label>
      <div className="bc-fila">
        <input
          type="text"
          className="ot-search bc-input"
          placeholder={placeholder}
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true); }}
          onFocus={abrir}
          onClick={abrir}
          disabled={readOnly}
        />
        {!readOnly && enCatalogo && (
          <button type="button" className="btn-mini btn-mini--warning" onClick={() => setEditando(enCatalogo)}
            title={`Editar este ${cfg.verbo} en el mantenedor de ${cfg.mantenedor}`}>
            <Pencil size={14} /> Editar
          </button>
        )}
        {!readOnly && enCatalogo === null && (
          <button type="button" className="btn-mini btn-mini--success" onClick={registrar}
            title={`Registrar este ${cfg.verbo} en el mantenedor de ${cfg.mantenedor}`}>
            <Icono size={14} /> Registrar
          </button>
        )}
        {accionExtra}
      </div>
      <div className="bc-espacio" />

      {abierto && (opciones.length > 0 || sinResultados) && (
        <div className="bc-lista">
          {opciones.map((r, i) => (
            <div key={`${cfg.clave(r)}-${i}`} className="bc-opcion" onClick={() => elegir(r)}>
              <div className="bc-titulo">
                {cfg.titulo(r)}
                {r.delCatalogo
                  ? <span className="bc-nota"> (catálogo)</span>
                  : cfg.clave(r) === claveActual && <span className="bc-nota"> (en la OT)</span>}
              </div>
              <div className="bc-detalle">{cfg.detalle(r)}</div>
            </div>
          ))}
          {sinResultados && <div className="bc-vacio">{cfg.vacio}</div>}
        </div>
      )}

      {editando && (
        <ModalEditarCatalogo tipo={tipo} registro={editando} onCerrar={() => setEditando(null)}
          onGuardado={(actualizado) => { onActualizado(actualizado); recargar(); }} />
      )}
    </div>
  );
}

export default CampoCatalogo;
