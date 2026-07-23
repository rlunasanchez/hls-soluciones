import { useState } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import api from "../../services/api";
import { toUpper } from "../../utils/helpers";

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
  nuevaOrden, setNuevaOrden,
  fetchEquipos,
  clienteSeleccionado,
  fromClientes = false,
  esEdicion = false,
  equipoOtroCliente = false,
  equipoNoExiste = false,
  readOnly = false,
  busquedaModelo, setBusquedaModelo,
  mostrarDropdownModelo, setMostrarDropdownModelo,
  equiposModeloFiltrados,
  equipoModeloDropdownRef
}) {
  const [mostrarModalEquipo, setMostrarModalEquipo] = useState(false);
  const [nuevoEquipo, setNuevoEquipo] = useState({
    equipo: "", marca: "", modelo: "", serie: "", nivel_tintas: "",
    contador_pag: 0, averia: "", actividad: "", observaciones: ""
  });
  const [insumos, setInsumos] = useState(
    Array(12).fill(null).map(() => ({ nombre: "" }))
  );
  const [insumosVisibles, setInsumosVisibles] = useState(2);

  const guardarNuevoEquipo = async () => {
    if (!nuevoEquipo.equipo.trim() || !nuevoEquipo.marca.trim() || !nuevoEquipo.modelo.trim()) {
      alert("Equipo, Marca y Modelo son obligatorios");
      return;
    }
    try {
      const ins = insumos.filter(i => i.nombre.trim() !== "").map(i => i.nombre);
      const payload = {
        equipo: nuevoEquipo.equipo.toUpperCase(),
        marca: nuevoEquipo.marca.toUpperCase(),
        modelo: nuevoEquipo.modelo.toUpperCase(),
        serie: nuevoEquipo.serie.toUpperCase() || null,
        nivel_tintas: nuevoEquipo.nivel_tintas.toUpperCase() || null,
        contador_pag: nuevoEquipo.contador_pag || 0,
        insumo1: ins[0] || null, insumo2: ins[1] || null, insumo3: ins[2] || null,
        insumo4: ins[3] || null, insumo5: ins[4] || null, insumo6: ins[5] || null,
        insumo7: ins[6] || null, insumo8: ins[7] || null, insumo9: ins[8] || null,
        insumo10: ins[9] || null, insumo11: ins[10] || null, insumo12: ins[11] || null,
        averia: nuevoEquipo.averia.toUpperCase() || null,
        actividad: nuevoEquipo.actividad.toUpperCase() || null,
        observaciones: nuevoEquipo.observaciones.toUpperCase() || null,
        cliente_id: clienteSeleccionado?.id || null
      };
      const resPost = await api.post("/api/equipos", payload);
      const codigoCreado = resPost.data.codigo;
      if (fetchEquipos) await fetchEquipos();
      const res = await api.get("/api/equipos");
      const creado = res.data.find(e => e.codigo === codigoCreado);
      if (creado) {
        seleccionarEquipo(creado);
        setNuevaOrden(prev => ({
          ...prev,
          averia: toUpper(creado.averia) || prev.averia,
          actividad: toUpper(creado.actividad) || prev.actividad,
          observaciones: toUpper(creado.observaciones) || prev.observaciones
        }));
        setBusquedaCodigo(creado.codigo || "");
      }
      setMostrarModalEquipo(false);
      setNuevoEquipo({ equipo: "", marca: "", modelo: "", serie: "", nivel_tintas: "", contador_pag: 0, averia: "", actividad: "", observaciones: "" });
      setInsumos(Array(12).fill(null).map(() => ({ nombre: "" })));
      setInsumosVisibles(2);
    } catch (err) {
      console.error("Error al crear equipo:", err);
      alert(err.response?.data?.msg || "Error al crear equipo");
    }
  };

  const inputStyle = {
    width: '100%', padding: '6px 10px',
    border: '2px solid var(--border)', borderRadius: '6px', fontSize: '.82rem'
  };

  return (
    <div className="of-sec muted">
      <div className="of-st muted">Datos del Equipo</div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
          {equipoOtroCliente && equipoSeleccionado && (
            <div style={{
              background: '#FFF3E0', padding: '6px 12px',
              borderRadius: '6px', fontSize: '0.85rem', color: '#F97316',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              ⚠ Equipo asignado a otro cliente: {equipoSeleccionado.equipo} - {equipoSeleccionado.marca} {equipoSeleccionado.modelo}
            </div>
          )}
          {equipoNoExiste && (
            <div style={{
              background: '#FEE2E2', padding: '6px 12px',
              borderRadius: '6px', fontSize: '0.85rem', color: '#DC2626',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              ⚠ Equipo desactivado — el equipo asociado fue desactivado del sistema
            </div>
          )}
          {!equipoOtroCliente && !equipoNoExiste && equipoSeleccionado && (
            <div style={{
              background: 'var(--success-light)', padding: '6px 12px',
              borderRadius: '6px', fontSize: '0.85rem', color: 'var(--success)',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              ✓ Seleccionado: {equipoSeleccionado.equipo} - {equipoSeleccionado.marca} {equipoSeleccionado.modelo}
            </div>
          )}
          {clienteSeleccionado && !readOnly && !fromClientes && (!esEdicion || !equipoSeleccionado || equipoOtroCliente) && (
            <button
              type="button"
              onClick={() => setMostrarModalEquipo(true)}
              title="Crear nuevo equipo"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'var(--primary)', color: 'white', border: 'none',
                padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                fontWeight: 500, fontSize: '0.8rem', whiteSpace: 'nowrap',
                height: '32px', marginLeft: 'auto'
              }}
            >
              <Plus size={14} /> Nuevo
            </button>
          )}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'8px'}}>
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
              disabled={readOnly}
              style={{
                width: '100%', padding: '6px 10px',
                border: '2px solid var(--info)', borderRadius: '6px', fontSize: '.82rem',
                background: equipoSeleccionado ? '#DCFCE7' : 'white'
              }}
            />

            {mostrarDropdownCodigo && busquedaCodigo.length >= 6 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'white', border: '2px solid var(--border)', borderTop: 'none',
                borderRadius: '0 0 8px 8px', maxHeight: '250px', overflow: 'auto',
                zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {equiposCodigoFiltrados.length > 0 ? (
                  equiposCodigoFiltrados.map((equipo) => (
                    <div key={equipo.id} onClick={() => {
                      seleccionarEquipoPorCodigo(equipo.codigo);
                      setMostrarDropdownCodigo(false);
                    }} style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
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
                setBusquedaSerie(e.target.value.toUpperCase());
                setMostrarDropdownEquipos(e.target.value.length >= 2);
              }}
              onFocus={() => {
                if (busquedaSerie.length >= 2) setMostrarDropdownEquipos(true);
              }}
              disabled={readOnly}
              style={{
                width: '100%', padding: '6px 10px',
                border: '2px solid var(--info)', borderRadius: '6px', fontSize: '.82rem',
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
                      style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
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
        </div>

        <div>
          <div ref={equipoModeloDropdownRef} style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: 'var(--text)' }}>
              <Search size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Buscar por Modelo
            </label>
            <input
              type="text"
              placeholder="Ej: IR2520"
              value={busquedaModelo}
              onChange={(e) => {
                setBusquedaModelo(e.target.value.toUpperCase());
                setMostrarDropdownModelo(e.target.value.length >= 2);
              }}
              onFocus={() => {
                if (busquedaModelo.length >= 2) setMostrarDropdownModelo(true);
              }}
              disabled={readOnly}
              style={{
                width: '100%', padding: '6px 10px',
                border: '2px solid var(--info)', borderRadius: '6px', fontSize: '.82rem',
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
                    <div key={equipo.id} onClick={() => seleccionarEquipo(equipo)}
                      style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {equipo.equipo} {equipo.marca} {equipo.modelo}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Código: {equipo.codigo || 'N/A'} | Serie: {equipo.serie || 'N/A'}
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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div className="of-f">
          <label>Equipo *</label>
          <input type="text" placeholder="Tipo de equipo" value={nuevaOrden.equipo}
            onChange={(e) => setNuevaOrden({...nuevaOrden, equipo: e.target.value.toUpperCase()})}
            disabled={readOnly}
            required style={inputStyle} />
        </div>
        <div className="of-f">
          <label>Marca *</label>
          <input type="text" placeholder="Marca del equipo" value={nuevaOrden.marca}
            onChange={(e) => setNuevaOrden({...nuevaOrden, marca: e.target.value.toUpperCase()})}
            disabled={readOnly}
            required style={inputStyle} />
        </div>
        <div className="of-f">
          <label>Modelo *</label>
          <input type="text" placeholder="Modelo del equipo" value={nuevaOrden.modelo}
            onChange={(e) => setNuevaOrden({...nuevaOrden, modelo: e.target.value.toUpperCase()})}
            disabled={readOnly}
            required style={inputStyle} />
        </div>
        <div className="of-f">
          <label>Serie</label>
          <input type="text" placeholder="Número de serie" value={nuevaOrden.serie}
            onChange={(e) => setNuevaOrden({...nuevaOrden, serie: e.target.value.toUpperCase()})}
            disabled={readOnly}
            style={inputStyle} />
        </div>
        <div className="of-f">
          <label>Nivel de Tinta</label>
          <input type="text" placeholder="Ej: 80%, lleno, etc." value={nuevaOrden.nivelTinta}
            onChange={(e) => setNuevaOrden({...nuevaOrden, nivelTinta: e.target.value.toUpperCase()})}
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

      {/* Modal Nuevo Equipo */}
      {mostrarModalEquipo && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setMostrarModalEquipo(false); }}
        >
          <div style={{
            background: 'white', borderRadius: '12px', padding: '24px',
            width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)' }}>Nuevo Equipo</h3>
              <button type="button" onClick={() => setMostrarModalEquipo(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Equipo *</label>
                <input type="text" placeholder="Ej: IMPRESORA" value={nuevoEquipo.equipo}
                  onChange={(e) => setNuevoEquipo({...nuevoEquipo, equipo: e.target.value.toUpperCase()})}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Marca *</label>
                <input type="text" placeholder="Ej: CANON" value={nuevoEquipo.marca}
                  onChange={(e) => setNuevoEquipo({...nuevoEquipo, marca: e.target.value.toUpperCase()})}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Modelo *</label>
                <input type="text" placeholder="Ej: IR2520" value={nuevoEquipo.modelo}
                  onChange={(e) => setNuevoEquipo({...nuevoEquipo, modelo: e.target.value.toUpperCase()})}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Serie</label>
                <input type="text" placeholder="Número de serie" value={nuevoEquipo.serie}
                  onChange={(e) => setNuevoEquipo({...nuevoEquipo, serie: e.target.value.toUpperCase()})}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Contador Páginas</label>
                <input type="number" placeholder="0" value={nuevoEquipo.contador_pag}
                  onChange={(e) => setNuevoEquipo({...nuevoEquipo, contador_pag: e.target.value})}
                  style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Nivel de Tinta</label>
                <input type="text" placeholder="Ej: 80%, lleno, etc." value={nuevoEquipo.nivel_tintas}
                  onChange={(e) => setNuevoEquipo({...nuevoEquipo, nivel_tintas: e.target.value.toUpperCase()})}
                  style={inputStyle} />
              </div>
            </div>

            {/* Insumos */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text)' }}>Insumos</label>
                {insumosVisibles < 12 && (
                  <button type="button" onClick={() => setInsumosVisibles(insumosVisibles + 1)}
                    style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                    + Agregar
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px' }}>
                {insumos.slice(0, insumosVisibles).map((ins, idx) => (
                  <div key={idx} style={{ display: 'contents' }}>
                    <input type="text" placeholder={`Insumo ${idx + 1}`} value={ins.nombre}
                      onChange={(e) => {
                        const nuevos = [...insumos];
                        nuevos[idx].nombre = e.target.value.toUpperCase();
                        setInsumos(nuevos);
                      }}
                      style={inputStyle} />
                    <button type="button" onClick={() => {
                      if (!window.confirm(`¿Eliminar insumo ${idx + 1}?`)) return;
                      const nuevas = insumos.filter((_, i) => i !== idx);
                      while (nuevas.length < 12) nuevas.push({ nombre: "" });
                      setInsumos(nuevas);
                      setInsumosVisibles(Math.max(2, insumosVisibles - 1));
                    }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Textareas */}
            <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Avería/Falla/Incidencia</label>
                <textarea placeholder="Descripción de falla..." value={nuevoEquipo.averia}
                  onChange={(e) => setNuevoEquipo({...nuevoEquipo, averia: e.target.value.toUpperCase()})}
                  rows={2} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Actividad</label>
                <textarea placeholder="Actividad realizada..." value={nuevoEquipo.actividad}
                  onChange={(e) => setNuevoEquipo({...nuevoEquipo, actividad: e.target.value.toUpperCase()})}
                  rows={2} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '0.85rem' }}>Observaciones</label>
                <textarea placeholder="Observaciones adicionales..." value={nuevoEquipo.observaciones}
                  onChange={(e) => setNuevoEquipo({...nuevoEquipo, observaciones: e.target.value.toUpperCase()})}
                  rows={2} style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setMostrarModalEquipo(false)}
                style={{
                  padding: '8px 16px', border: '2px solid var(--border)', borderRadius: '6px',
                  background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem'
                }}>
                Cancelar
              </button>
              <button type="button" onClick={guardarNuevoEquipo}
                style={{
                  padding: '8px 16px', border: 'none', borderRadius: '6px',
                  background: 'var(--success)', color: 'white', cursor: 'pointer',
                  fontWeight: 500, fontSize: '0.85rem'
                }}>
                <Plus size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Crear Equipo
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

export default OrdenFormEquipo;
