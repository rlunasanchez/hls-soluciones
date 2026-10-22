import { Search, Users, ChevronDown, Eye, UserPlus } from "lucide-react";
import { upperInput, formatearRutInput } from "../../utils/helpers";

// Buscador de cliente de la OT: caja de búsqueda con lista de resultados (por nombre, RUT o código),
// tarjeta del cliente asignado y los botones Ver / Editar / Registrar en Clientes.
function OrdenBuscadorCliente({
  busquedaCliente, setBusquedaCliente,
  mostrarDropdownClientes, setMostrarDropdownClientes,
  clienteDropdownRef, clientesFiltrados, seleccionarCliente,
  clienteSeleccionado, clienteFijo = false, clienteInactivo = false, readOnly = false,
  nuevaOrden, abrirDetalleCliente, botonesEditarCliente, abrirRegistrarCliente
}) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
        {clienteFijo && clienteSeleccionado ? (
          <>
            <Users size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Cliente Asignado
          </>
        ) : (
          <>
            <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Buscar y Seleccionar Cliente
          </>
        )}
      </label>

      {clienteFijo && clienteSeleccionado ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 8px',
            background: '#E0F2FE',
            border: '1.5px solid var(--primary)',
            borderRadius: 'var(--radius-sm)',
            flexWrap: 'wrap'
          }}>
            <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
              {clienteSeleccionado.codigo || 'CL-XXXX'}
            </span>
            <span style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.85rem' }}>
              {clienteSeleccionado.razon_social}
            </span>
            {clienteInactivo ? (
              <span style={{ background: '#F97316', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                ⚠ Cliente desactivado
              </span>
            ) : null}
          </div>
          {readOnly && (
            <button
              type="button"
              onClick={abrirDetalleCliente}
              title="Ver todos los datos del cliente"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#0D9488',
                color: 'white',
                border: 'none',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                height: '24px'
              }}
            >
              <Eye size={14} /> Ver
            </button>
          )}
          {!readOnly && botonesEditarCliente}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <div ref={clienteDropdownRef} style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="ot-search bc-input"
            placeholder="Escriba para buscar cliente por nombre o RUT..."
            value={busquedaCliente}
            onChange={(e) => {
              // Si lo escrito parece RUT (puro número/K/guion/puntos) agrega los puntos;
              // si es texto (razón social o código CL/EQ) deja pasar normal
              const crudo = e.target.value;
              const val = /^[0-9][0-9Kk.-]*$/.test(crudo)
                ? formatearRutInput(crudo)
                : upperInput(e);
              setBusquedaCliente(val);
              setMostrarDropdownClientes(val.length >= 2);
            }}
            onFocus={() => {
              if (busquedaCliente.length >= 2) setMostrarDropdownClientes(true);
            }}
            disabled={readOnly}
          />
          {clienteInactivo && (
            <span style={{
              position: 'absolute',
              right: '40px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#F97316',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}>
              ⚠ Cliente desactivado
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
              border: '1.5px solid var(--border)',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              maxHeight: '250px',
              overflow: 'auto',
              zIndex: 1000,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              {clientesFiltrados === null ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Buscando…
                </div>
              ) : clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    onClick={() => seleccionarCliente(cliente)}
                    style={{
                      padding: '2px 8px',
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
                      <span style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                        {cliente.tipo === 'PERSONA' ? 'PERSONA' : 'EMPRESA'}
                      </span>
                      <span style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {cliente.razon_social}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      RUT: {cliente.rut || 'N/A'} | {cliente.direccion || ''}, {cliente.comuna || ''}
                      {cliente.telefono ? ` | Tel: ${cliente.telefono}` : ''}
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
        {clienteSeleccionado && readOnly && (
          <button
            type="button"
            onClick={abrirDetalleCliente}
            title="Ver todos los datos del cliente"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#0D9488',
              color: 'white',
              border: 'none',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              height: '24px'
            }}
          >
              <Eye size={14} /> Ver
          </button>
        )}
        {!readOnly && clienteSeleccionado && botonesEditarCliente}
        {!readOnly && !clienteSeleccionado && ((nuevaOrden.cliente || "").trim() || (nuevaOrden.rut || "").trim()) && (
          <button type="button" className="btn-mini btn-mini--success" onClick={abrirRegistrarCliente}
            title="Registrar este cliente en el mantenedor de Clientes">
            <UserPlus size={14} /> Registrar en Clientes
          </button>
        )}
        </div>
        )}
      </div>
  );
}

export default OrdenBuscadorCliente;
