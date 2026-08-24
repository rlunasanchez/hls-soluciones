import { useState } from "react";
import { Search, Eye, PackagePlus, Pencil } from "lucide-react";
import EquipoFormulario from "../equipos/EquipoFormulario";
import { createPortal } from "react-dom";
import api from "../../services/api";
import "../../styles/Equipos.css";
import { upperInput, toUpper } from "../../utils/helpers";

function OrdenFormEquipo({
  children,
  seleccionarEquipoPorModelo,
  equipoSeleccionado,
  nuevaOrden, setNuevaOrden,
  readOnly = false,
  busquedaModelo, setBusquedaModelo,
  mostrarDropdownModelo, setMostrarDropdownModelo,
  equiposModeloFiltrados,
  equipoModeloDropdownRef,
  equipos = [],
  equipoFijo = false,
  editingId = null,
  onRegistrarEquipo = null,
  onEquiposRefresh = null
}) {
  const [mostrarDetalleEquipo, setMostrarDetalleEquipo] = useState(false);
  const [mostrarEditarEquipo, setMostrarEditarEquipo] = useState(false);
  const [equipoEnEdicion, setEquipoEnEdicion] = useState(null);

  const inputStyle = {
    width: '100%', padding: '2px 8px',
    border: '1.5px solid var(--border)', borderRadius: '6px', fontSize: '.82rem'
  };

  const equipoSnapshot = {
    codigo: "",
    equipo: nuevaOrden.equipo || "",
    marca: nuevaOrden.marca || "",
    modelo: nuevaOrden.modelo || "",
    serie: nuevaOrden.serie || ""
  };
  const hayDatosEquipo = !!(nuevaOrden.equipo || nuevaOrden.marca || nuevaOrden.modelo || nuevaOrden.serie);
  const normEq = (v) => (v || "").trim().toLowerCase();
  const equipoExistente = (equipos || []).find(eq =>
    normEq(eq.equipo) === normEq(nuevaOrden.equipo) &&
    normEq(eq.marca) === normEq(nuevaOrden.marca) &&
    normEq(eq.modelo) === normEq(nuevaOrden.modelo)
  );

  const abrirEditarEquipo = () => {
    if (!equipoExistente) return;
    setEquipoEnEdicion(equipoExistente);
    setMostrarEditarEquipo(true);
  };

  const handleGuardarEdicionEquipo = async (payload, id, mantener = false) => {
    try {
      await api.put(`/api/equipos/${id}`, payload);
      const lista = await api.get("/api/equipos");
      if (onEquiposRefresh) onEquiposRefresh(lista.data);
      const res = await api.get(`/api/equipos/${id}`);
      setNuevaOrden(prev => ({
        ...prev,
        equipo: toUpper(res.data.equipo),
        marca: toUpper(res.data.marca),
        modelo: toUpper(res.data.modelo),
        serie: res.data.serie ? toUpper(res.data.serie) : ""
      }));
      if (mantener && id) {
        setEquipoEnEdicion(res.data);
      } else {
        setMostrarEditarEquipo(false);
        setEquipoEnEdicion(null);
      }
    } catch (err) {
      alert(err.response?.data?.msg || "Error al guardar el equipo.");
    }
  };

  return (
    <div className="of-sec primary">
      <div className="of-st muted">Datos del Equipo</div>

      {equipoFijo && equipoSeleccionado && (
        <div style={{
          flex: 1,
          background: '#DCFCE7', border: '1.5px solid var(--success)',
          padding: '2px 8px', borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
          marginBottom: '10px'
        }}>
          <span style={{ background: 'var(--success)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
            {equipoSeleccionado.codigo || 'EQ-XXXX'}
          </span>
          <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.85rem' }}>
            {equipoSeleccionado.equipo} {equipoSeleccionado.marca} {equipoSeleccionado.modelo}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Serie: {equipoSeleccionado.serie || 'N/A'}
          </span>
        </div>
      )}

      {equipoFijo && equipoSeleccionado ? null : (
      <div className="of-r3" style={{ gap: '20px', marginBottom: '8px' }}>
        <div>
          <div ref={equipoModeloDropdownRef} style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
              <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Buscar por Modelo
            </label>
            <div>
              <input
                type="text"
                className="ot-search"
                placeholder="Ej: IR2520"
                value={busquedaModelo}
                onChange={(e) => {
                  setBusquedaModelo(upperInput(e));
                  setMostrarDropdownModelo(e.target.value.length >= 2);
                }}
                onFocus={() => {
                  if (busquedaModelo.length >= 2) setMostrarDropdownModelo(true);
                }}
                disabled={readOnly}
                style={{
                  width: '100%', padding: '2px 8px',
                  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.82rem',
                  background: equipoSeleccionado ? '#E0F2FE' : 'white'
                }}
              />
            </div>

            {mostrarDropdownModelo && busquedaModelo.length >= 2 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'white', border: '2px solid var(--border)', borderTop: 'none',
                borderRadius: '0 0 8px 8px', maxHeight: '250px', overflow: 'auto',
                zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {equiposModeloFiltrados.length > 0 ? (
                  equiposModeloFiltrados.map((equipo) => (
                    <div key={equipo.id} onClick={() => seleccionarEquipoPorModelo(equipo)}
                      style={{ padding: '2px 8px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {equipo.equipo} {equipo.marca} {equipo.modelo}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No se encontraron equipos con modelo "{busquedaModelo}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {!readOnly && onRegistrarEquipo && (
          <button
            type="button"
            onClick={() => onRegistrarEquipo()}
            title="Registrar este equipo en el mantenedor de Equipos si no existe"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'var(--success)', color: 'white', border: 'none',
              padding: '2px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap',
              flexShrink: 0, height: '24px', alignSelf: 'end'
            }}
          >
            <PackagePlus size={14} /> Registrar en Equipos
          </button>
        )}
        {!readOnly && equipoExistente && (
          <button
            type="button"
            onClick={abrirEditarEquipo}
            title="Editar en el mantenedor el equipo con estos datos"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'var(--warning)', color: 'white', border: 'none',
              padding: '2px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap',
              flexShrink: 0, height: '24px', alignSelf: 'end'
            }}
          >
            <Pencil size={14} /> Editar
          </button>
        )}
        {readOnly && hayDatosEquipo && (
          <button
            type="button"
            onClick={() => setMostrarDetalleEquipo(true)}
            title="Ver datos del equipo"
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: '#0D9488', color: 'white', border: 'none',
              padding: '2px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap',
              flexShrink: 0, height: '24px', alignSelf: 'end'
            }}
          >
            <Eye size={14} /> Ver
          </button>
        )}
      </div>
      )}

      <div className="of-r3" style={{ gap: '20px', marginBottom: '20px' }}>
        <div className="of-f">
          <label>Equipo *</label>
          <input type="text" placeholder="Tipo de equipo" value={nuevaOrden.equipo}
            onChange={(e) => setNuevaOrden({...nuevaOrden, equipo: upperInput(e)})}
            disabled={readOnly}
            required style={inputStyle} />
        </div>
        <div className="of-f">
          <label>Marca *</label>
          <input type="text" placeholder="Marca del equipo" value={nuevaOrden.marca}
            onChange={(e) => setNuevaOrden({...nuevaOrden, marca: upperInput(e)})}
            disabled={readOnly}
            required style={inputStyle} />
        </div>
        <div className="of-f">
          <label>Modelo *</label>
          <input type="text" placeholder="Modelo del equipo" value={nuevaOrden.modelo}
            onChange={(e) => setNuevaOrden({...nuevaOrden, modelo: upperInput(e)})}
            disabled={readOnly}
            required style={inputStyle} />
        </div>
        <div className="of-f">
          <label>Serie</label>
          <input type="text" placeholder="Número de serie" value={nuevaOrden.serie}
            onChange={(e) => setNuevaOrden({...nuevaOrden, serie: upperInput(e)})}
            disabled={readOnly}
            style={inputStyle} />
        </div>
        <div className="of-f">
          <label>Nivel de Tinta</label>
          <select
            value={nuevaOrden.nivelTinta}
            onChange={(e) => setNuevaOrden({...nuevaOrden, nivelTinta: e.target.value})}
            disabled={readOnly}
            style={inputStyle}
          >
            <option value="">Seleccionar...</option>
            <option value="LLENO">Lleno</option>
            <option value="MEDIO">Medio</option>
            <option value="BAJO">Bajo</option>
          </select>
        </div>
        <div className="of-f">
          <label>Contador Páginas OUT</label>
          <input type="number" placeholder="0" value={nuevaOrden.contadorPagOut}
            onChange={(e) => setNuevaOrden({...nuevaOrden, contadorPagOut: e.target.value})}
            disabled={readOnly}
            style={inputStyle} />
        </div>
      </div>

      {/* Modal Detalle Equipo (solo lectura) — portal fuera del form de la OT */}
      {mostrarDetalleEquipo && (equipoSeleccionado || hayDatosEquipo) && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setMostrarDetalleEquipo(false); }}
        >
          <div style={{ maxHeight: '90vh', overflow: 'auto', width: '100%', maxWidth: '900px' }}>
            <EquipoFormulario
              equipoEditando={equipoSeleccionado || equipoSnapshot}
              equipos={equipos}
              onSave={() => {}}
              onCancel={() => setMostrarDetalleEquipo(false)}
              readOnly
            />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Editar Equipo (mantenedor desde la OT) — portal fuera del form de la OT */}
      {mostrarEditarEquipo && equipoEnEdicion && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) { setMostrarEditarEquipo(false); setEquipoEnEdicion(null); } }}
        >
          <div style={{ maxHeight: '90vh', overflow: 'auto', width: '100%', maxWidth: '900px' }}>
            <EquipoFormulario
              equipoEditando={equipoEnEdicion}
              equipos={equipos}
              onSave={handleGuardarEdicionEquipo}
              onCancel={() => { setMostrarEditarEquipo(false); setEquipoEnEdicion(null); }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Modal Nuevo Equipo (registrar en inventario desde la OT) */}
      {children}
    </div>
  );
}

export default OrdenFormEquipo;
