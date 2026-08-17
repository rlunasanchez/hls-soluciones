import { useState } from "react";
import { Search, Eye } from "lucide-react";
import EquipoFormulario from "../equipos/EquipoFormulario";
import "../../styles/Equipos.css";
import { upperInput } from "../../utils/helpers";

function OrdenFormEquipo({
  children,
  busquedaSerie, setBusquedaSerie,
  mostrarDropdownEquipos, setMostrarDropdownEquipos,
  equiposFiltrados,
  equipoDropdownRef,
  seleccionarEquipo,
  seleccionarEquipoPorModelo,
  equipoSeleccionado,
  nuevaOrden, setNuevaOrden,
  readOnly = false,
  busquedaModelo, setBusquedaModelo,
  mostrarDropdownModelo, setMostrarDropdownModelo,
  equiposModeloFiltrados,
  equipoModeloDropdownRef,
  equipos = [],
  equipoFijo = false
}) {
  const [mostrarDetalleEquipo, setMostrarDetalleEquipo] = useState(false);

  const inputStyle = {
    width: '100%', padding: '2px 8px',
    border: '1.5px solid var(--border)', borderRadius: '6px', fontSize: '.82rem'
  };

  return (
    <div className="of-sec muted">
      <div className="of-st muted">Datos del Equipo</div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
          {equipoFijo && equipoSeleccionado && (
            <div style={{
              flex: 1,
              background: '#DCFCE7', border: '2px solid var(--success)',
              padding: '8px 12px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'
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
              <span style={{ background: 'var(--success)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                ✓ Seleccionado
              </span>
            </div>
          )}
          {equipoSeleccionado && !equipoFijo && (
            <div style={{
              background: 'var(--success-light)', padding: '6px 12px',
              borderRadius: '6px', fontSize: '0.85rem', color: 'var(--success)',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              ✓ Seleccionado: {equipoSeleccionado.equipo} - {equipoSeleccionado.marca} {equipoSeleccionado.modelo}
            </div>
          )}
          {equipoSeleccionado && readOnly && (
            <button
              type="button"
              onClick={() => setMostrarDetalleEquipo(true)}
              title="Ver datos del equipo"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: '#0D9488', color: 'white', border: 'none',
                padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                fontWeight: 500, fontSize: '0.8rem', whiteSpace: 'nowrap',
                flexShrink: 0, height: '32px', marginLeft: 'auto'
              }}
            >
              <Eye size={14} /> Ver
            </button>
          )}
        </div>
      </div>

      {equipoFijo && equipoSeleccionado ? null : (
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'8px'}}>
        <div>
          <div ref={equipoDropdownRef} style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
              <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Buscar Equipo por Serie
            </label>
            <input
              type="text"
              className="ot-search"
              placeholder="Ingrese número de serie..."
              value={busquedaSerie}
              onChange={(e) => {
                setBusquedaSerie(upperInput(e));
                setMostrarDropdownEquipos(e.target.value.length >= 2);
              }}
              onFocus={() => {
                if (busquedaSerie.length >= 2) setMostrarDropdownEquipos(true);
              }}
              disabled={readOnly}
              style={{
                width: '100%', padding: '2px 8px',
                border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '.82rem',
                background: equipoSeleccionado ? '#DCFCE7' : 'white'
              }}
            />

            {mostrarDropdownEquipos && busquedaSerie.length >= 2 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'white', border: '2px solid var(--border)', borderTop: 'none',
                borderRadius: '0 0 8px 8px', maxHeight: '250px', overflow: 'auto',
                zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {equiposFiltrados.length > 0 ? (
                  equiposFiltrados.map((equipo) => (
                    <div key={equipo.id} onClick={() => seleccionarEquipo(equipo)}
                      style={{ padding: '2px 8px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--success-light)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {equipo.equipo} {equipo.marca} {equipo.modelo}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Serie: {equipo.serie || 'N/A'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No se encontraron equipos con serie "{busquedaSerie}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <div ref={equipoModeloDropdownRef} style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
              <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Buscar por Modelo
            </label>
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
                background: equipoSeleccionado ? '#DCFCE7' : 'white'
              }}
            />

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
      </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div className="of-f" style={{ gridColumn: 'span 2' }}>
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
          <input type="text" placeholder="Ej: 80%, lleno, etc." value={nuevaOrden.nivelTinta}
            onChange={(e) => setNuevaOrden({...nuevaOrden, nivelTinta: upperInput(e)})}
            disabled={readOnly}
            style={inputStyle} />
        </div>
        <div className="of-f">
          <label>Contador Páginas OUT</label>
          <input type="number" placeholder="0" value={nuevaOrden.contadorPagOut}
            onChange={(e) => setNuevaOrden({...nuevaOrden, contadorPagOut: e.target.value})}
            disabled={readOnly}
            style={inputStyle} />
        </div>
      </div>

      {/* Modal Detalle Equipo (solo lectura) */}
      {mostrarDetalleEquipo && equipoSeleccionado && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setMostrarDetalleEquipo(false); }}
        >
          <div style={{ maxHeight: '90vh', overflow: 'auto', width: '100%', maxWidth: '900px' }}>
            <EquipoFormulario
              equipoEditando={equipoSeleccionado}
              equipos={equipos}
              onSave={() => {}}
              onCancel={() => setMostrarDetalleEquipo(false)}
              readOnly
            />
          </div>
        </div>
      )}

      {/* Modal Nuevo Equipo (registrar en inventario desde la OT) */}
      {children}
    </div>
  );
}

export default OrdenFormEquipo;
