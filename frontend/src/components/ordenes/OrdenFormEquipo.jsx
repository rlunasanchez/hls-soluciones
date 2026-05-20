import { Search } from "lucide-react";

function OrdenFormEquipo({
  children,
  busquedaCodigo, setBusquedaCodigo,
  mostrarDropdownCodigo, setMostrarDropdownCodigo,
  equiposCodigoFiltrados,
  equipoCodigoDropdownRef,
  seleccionarEquipoPorCodigo,
  busquedaSerie, setBusquedaSerie,
  mostrarDropdownEquipos, setMostrarDropdownEquipos,
  equiposFiltrados,
  equipoDropdownRef,
  seleccionarEquipo,
  equipoSeleccionado,
  nuevaOrden, setNuevaOrden
}) {
  return (
    <div className="of-sec muted">
      <div className="of-st muted">Datos del Equipo</div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'8px'}}>
        <div>
          <div ref={equipoCodigoDropdownRef} style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
              <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Buscar por código (EQ-XXX)
            </label>
            <input
              type="text"
              placeholder="Ej: EQ-0001"
              value={busquedaCodigo}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setBusquedaCodigo(val);
                setMostrarDropdownCodigo(val.length >= 6);
              }}
              onFocus={() => {
                if (busquedaCodigo.length >= 6) setMostrarDropdownCodigo(true);
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '2px solid var(--info)',
                borderRadius: '6px',
                fontSize: '.82rem',
                background: equipoSeleccionado?.codigo === busquedaCodigo ? '#DCFCE7' : 'white'
              }}
            />

            {mostrarDropdownCodigo && busquedaCodigo.length >= 6 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '2px solid var(--border)',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                maxHeight: '250px',
                overflow: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {equiposCodigoFiltrados.length > 0 ? (
                  equiposCodigoFiltrados.map((equipo) => (
                    <div
                      key={equipo.id}
                      onClick={() => {
                        seleccionarEquipoPorCodigo(equipo.codigo);
                        setMostrarDropdownCodigo(false);
                      }}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {equipo.codigo} - {equipo.equipo} {equipo.marca} {equipo.modelo}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Serie: {equipo.serie || 'N/A'} | Cliente: {equipo.cliente_nombre || 'N/A'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No se encontraron equipos con código "{busquedaCodigo}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <div ref={equipoDropdownRef} style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
              <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Buscar Equipo por Serie
            </label>
            <input
              type="text"
              placeholder="Ingrese número de serie..."
              value={busquedaSerie}
              onChange={(e) => {
                setBusquedaSerie(e.target.value);
                setMostrarDropdownEquipos(e.target.value.length >= 2);
              }}
              onFocus={() => {
                if (busquedaSerie.length >= 2) setMostrarDropdownEquipos(true);
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '2px solid var(--success)',
                borderRadius: '6px',
                fontSize: '.82rem',
                background: equipoSeleccionado ? '#DCFCE7' : 'white'
              }}
            />

            {mostrarDropdownEquipos && busquedaSerie.length >= 2 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '2px solid var(--border)',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                maxHeight: '250px',
                overflow: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {equiposFiltrados.length > 0 ? (
                  equiposFiltrados.map((equipo) => (
                    <div
                      key={equipo.id}
                      onClick={() => seleccionarEquipo(equipo)}
                      style={{
                        padding: '6px 10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--success-light)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {equipo.equipo} {equipo.marca} {equipo.modelo}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Serie: {equipo.serie || 'N/A'} | Código: {equipo.codigo || 'N/A'}
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

          {equipoSeleccionado && (
            <div style={{
              background: 'var(--success-light)',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px'
            }}>
              ✓ Seleccionado: {equipoSeleccionado.equipo} - {equipoSeleccionado.marca} {equipoSeleccionado.modelo}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div className="of-f">
          <label>Equipo *</label>
          <input
            type="text"
            placeholder="Tipo de equipo"
            value={nuevaOrden.equipo}
            onChange={(e) => setNuevaOrden({...nuevaOrden, equipo: e.target.value})}
            required
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>

        <div className="of-f">
          <label>Marca *</label>
          <input
            type="text"
            placeholder="Marca del equipo"
            value={nuevaOrden.marca}
            onChange={(e) => setNuevaOrden({...nuevaOrden, marca: e.target.value})}
            required
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>

        <div className="of-f">
          <label>Modelo *</label>
          <input
            type="text"
            placeholder="Modelo del equipo"
            value={nuevaOrden.modelo}
            onChange={(e) => setNuevaOrden({...nuevaOrden, modelo: e.target.value})}
            required
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>

        <div className="of-f">
          <label>Serie</label>
          <input
            type="text"
            placeholder="Número de serie"
            value={nuevaOrden.serie}
            onChange={(e) => setNuevaOrden({...nuevaOrden, serie: e.target.value})}
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--border)',
              borderRadius: '6px',
              fontSize: '.82rem'
            }}
          />
        </div>
      </div>
      {children}
    </div>
  );
}

export default OrdenFormEquipo;
