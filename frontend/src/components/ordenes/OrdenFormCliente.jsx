import { Search, ChevronDown } from "lucide-react";

function OrdenFormCliente({
  busquedaCliente, setBusquedaCliente,
  mostrarDropdownClientes, setMostrarDropdownClientes,
  clienteSeleccionado,
  clientesFiltrados,
  clienteDropdownRef,
  seleccionarCliente,
  nuevaOrden, setNuevaOrden
}) {
  return (
    <div className="of-sec success">
      <div className="of-st success">Datos del Cliente</div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
          <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
          Buscar y Seleccionar Cliente
        </label>
        <div ref={clienteDropdownRef} style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Escriba para buscar cliente por nombre o RUT..."
            value={busquedaCliente}
            onChange={(e) => {
              setBusquedaCliente(e.target.value);
              setMostrarDropdownClientes(e.target.value.length >= 2);
            }}
            onFocus={() => {
              if (busquedaCliente.length >= 2) setMostrarDropdownClientes(true);
            }}
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '2px solid var(--primary)',
              borderRadius: '6px',
              fontSize: '.82rem',
              background: clienteSeleccionado ? '#E0F2FE' : 'white'
            }}
          />
          {clienteSeleccionado && (
            <span style={{
              position: 'absolute',
              right: '40px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--success)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}>
              ✓ Seleccionado
            </span>
          )}
          <ChevronDown
            size={20}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />

          {mostrarDropdownClientes && busquedaCliente.length >= 2 && (
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
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    onClick={() => seleccionarCliente(cliente)}
                    style={{
                      padding: '6px 10px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                        {cliente.codigo || 'CL-XXXX'}
                      </span>
                      <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {cliente.razon_social}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      RUT: {cliente.rut || 'N/A'} | {cliente.direccion || ''}, {cliente.comuna || ''}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No se encontraron clientes con "{busquedaCliente}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div className="of-f">
          <label>Cliente *</label>
          <input
            type="text"
            placeholder="Nombre del cliente"
            value={nuevaOrden.cliente}
            onChange={(e) => setNuevaOrden({...nuevaOrden, cliente: e.target.value})}
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
          <label>Dirección</label>
          <input
            type="text"
            placeholder="Dirección del cliente"
            value={nuevaOrden.direccion}
            onChange={(e) => setNuevaOrden({...nuevaOrden, direccion: e.target.value})}
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
          <label>Comuna</label>
          <input
            type="text"
            placeholder="Comuna"
            value={nuevaOrden.comuna}
            onChange={(e) => setNuevaOrden({...nuevaOrden, comuna: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <div className="of-f">
          <label>Contacto</label>
          <input
            type="text"
            placeholder="Nombre del contacto"
            value={nuevaOrden.contacto}
            onChange={(e) => setNuevaOrden({...nuevaOrden, contacto: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
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
          <label>Fono Principal</label>
          <input
            type="tel"
            placeholder="Teléfono de contacto"
            value={nuevaOrden.fonoPrincipal}
            onChange={(e) => setNuevaOrden({...nuevaOrden, fonoPrincipal: e.target.value.replace(/[^0-9+]/g, '')})}
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
          <label>Técnico Asignado *</label>
          <input
            type="text"
            placeholder="Nombre y apellido del técnico"
            value={nuevaOrden.tecnicoAsignado}
            onChange={(e) => setNuevaOrden({...nuevaOrden, tecnicoAsignado: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})}
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
      </div>
    </div>
  );
}

export default OrdenFormCliente;
