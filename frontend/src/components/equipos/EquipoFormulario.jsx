import { useState, useEffect, useRef } from "react";
import { Package, Save, X, Trash2 } from "lucide-react";
import api from "../../services/api";
import { toUpper } from "../../utils/helpers";

function EquipoFormulario({ equipoEditando, onCancel, onSave, equipos, clientes: clientesProp, readOnly = false }) {
  const [nuevoEquipo, setNuevoEquipo] = useState({
    codigo: "", equipo: "", modelo: "", marca: "", serie: "",
    contador_pag: 0, nivel_tintas: "", cliente_id: "",
    insumo1: "", insumo2: "", insumo3: "", insumo4: "", insumo5: "", insumo6: "",
    insumo7: "", insumo8: "", insumo9: "", insumo10: "", insumo11: "", insumo12: "",
    averia: "", actividad: "", observaciones: ""
  });

  const [clientes, setClientes] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const clienteDropdownRef = useRef(null);

  const [insumos, setInsumos] = useState(
    Array(12).fill(null).map(() => ({ nombre: "" }))
  );
  const [insumosVisibles, setInsumosVisibles] = useState(2);

  const codigoActual = (() => {
    let max = 0;
    (equipos || []).forEach(eq => {
      if (eq.codigo && eq.codigo.startsWith("EQ-")) {
        const num = parseInt(eq.codigo.split("-")[1], 10);
        if (num > max) max = num;
      }
    });
    return `EQ-${String(max + 1).padStart(4, "0")}`;
  })();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target)) {
        setMostrarDropdownClientes(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (clientesProp && clientesProp.length > 0) {
      setClientes(clientesProp);
    } else {
      api.get("/api/clientes").then(res => setClientes(res.data)).catch(() => {});
    }
  }, [clientesProp]);

  useEffect(() => {
    if (equipoEditando) {
      setNuevoEquipo({
        codigo: equipoEditando.codigo || "",
        equipo: toUpper(equipoEditando.equipo),
        modelo: toUpper(equipoEditando.modelo),
        marca: toUpper(equipoEditando.marca),
        serie: toUpper(equipoEditando.serie),
        contador_pag: equipoEditando.contador_pag || 0,
        nivel_tintas: toUpper(equipoEditando.nivel_tintas),
        cliente_id: equipoEditando.cliente_id || "",
        insumo1: toUpper(equipoEditando.insumo1),
        insumo2: toUpper(equipoEditando.insumo2),
        insumo3: toUpper(equipoEditando.insumo3),
        insumo4: toUpper(equipoEditando.insumo4),
        insumo5: toUpper(equipoEditando.insumo5),
        insumo6: toUpper(equipoEditando.insumo6),
        insumo7: toUpper(equipoEditando.insumo7),
        insumo8: toUpper(equipoEditando.insumo8),
        insumo9: toUpper(equipoEditando.insumo9),
        insumo10: toUpper(equipoEditando.insumo10),
        insumo11: toUpper(equipoEditando.insumo11),
        insumo12: toUpper(equipoEditando.insumo12),
        averia: toUpper(equipoEditando.averia),
        actividad: toUpper(equipoEditando.actividad),
        observaciones: toUpper(equipoEditando.observaciones)
      });
      const arr = [
        equipoEditando.insumo1, equipoEditando.insumo2, equipoEditando.insumo3,
        equipoEditando.insumo4, equipoEditando.insumo5, equipoEditando.insumo6,
        equipoEditando.insumo7, equipoEditando.insumo8, equipoEditando.insumo9,
        equipoEditando.insumo10, equipoEditando.insumo11, equipoEditando.insumo12
      ].map(i => ({ nombre: (i || "").toUpperCase() }));
      while (arr.length < 12) arr.push({ nombre: "" });
      setInsumos(arr);
      setInsumosVisibles(arr.filter(i => i.nombre).length || 2);

      if (equipoEditando.cliente_id && clientes.length > 0) {
        const c = clientes.find(cl => cl.id === equipoEditando.cliente_id);
        if (c) {
          setClienteSeleccionado(c);
          setBusquedaCliente((c.razon_social || "").toUpperCase());
          setNuevoEquipo(prev => ({ ...prev, cliente_id: c.id }));
        }
      }
    }
  }, [equipoEditando, clientes]);

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente((cliente.razon_social || "").toUpperCase());
    setNuevoEquipo(prev => ({ ...prev, cliente_id: cliente.id }));
    setMostrarDropdownClientes(false);
  };

  const clientesFiltrados = busquedaCliente.length >= 2 ? clientes.filter(c =>
    c.razon_social?.toLowerCase().includes(busquedaCliente.toLowerCase())
  ).slice(0, 8) : [];

  const actualizarInsumo = (idx, valor) => {
    const nuevos = [...insumos];
    nuevos[idx].nombre = valor.toUpperCase();
    setInsumos(nuevos);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nuevoEquipo.cliente_id) {
      alert("Debe seleccionar un cliente para asociar al equipo");
      return;
    }
    const ins = insumos.filter(i => i.nombre.trim() !== "").map(i => i.nombre);
    const payload = {
      ...nuevoEquipo,
      insumo1: ins[0] || "", insumo2: ins[1] || "", insumo3: ins[2] || "",
      insumo4: ins[3] || "", insumo5: ins[4] || "", insumo6: ins[5] || "",
      insumo7: ins[6] || "", insumo8: ins[7] || "", insumo9: ins[8] || "",
      insumo10: ins[9] || "", insumo11: ins[10] || "", insumo12: ins[11] || ""
    };
    onSave(payload, equipoEditando?.id);
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '740px', margin: '0 auto', padding: '20px' }}>
        <div className="ef-wrap">
          <div className="ef-head">
            <h2><Package size={22} />{readOnly ? "Ver Equipo" : equipoEditando ? "Editar Equipo" : "Nuevo Equipo"}</h2>
            <button type="button" className="ef-head-close" onClick={onCancel}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="ef-form">
            <div className="ef-s primary">
              <div className="ef-st primary">Información del Equipo</div>
              <div className="ef-r2" style={{ marginBottom: '8px' }}>
                <div className="ef-f ef-code">
                  <label>Código</label>
                  <input value={equipoEditando ? (equipoEditando.codigo || codigoActual) : codigoActual} disabled />
                </div>
                <div className="ef-f">
                  <label>Cliente Asociado *</label>
                  <div ref={clienteDropdownRef} className="ef-sc">
                    <input placeholder="Buscar cliente..." value={busquedaCliente}
                      disabled={readOnly}
                      onChange={(e) => { setBusquedaCliente(e.target.value.toUpperCase()); setMostrarDropdownClientes(e.target.value.length >= 2); }}
                      onFocus={() => { if (busquedaCliente.length >= 2) setMostrarDropdownClientes(true); }} required />
                    {clienteSeleccionado && <span className="ef-sc-ok">✓</span>}
                    {mostrarDropdownClientes && clientesFiltrados.length > 0 && (
                      <div className="ef-sc-dd">
                        {clientesFiltrados.map((c) => (
                          <div key={c.id} className="ef-sc-item" onClick={() => seleccionarCliente(c)}>
                            <div><strong>{c.razon_social}</strong></div>
                            <small>RUT: {c.rut || 'N/A'}</small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="ef-r2">
                <div className="ef-f">
                  <label>Equipo *</label>
                  <input placeholder="Nombre del equipo" value={nuevoEquipo.equipo}
                    disabled={readOnly}
                    onChange={e => setNuevoEquipo({...nuevoEquipo, equipo: e.target.value.toUpperCase()})} required />
                </div>
                <div className="ef-f">
                  <label>Marca *</label>
                  <input placeholder="Marca" value={nuevoEquipo.marca}
                    disabled={readOnly}
                    onChange={e => setNuevoEquipo({...nuevoEquipo, marca: e.target.value.toUpperCase()})} required />
                </div>
              </div>
              <div className="ef-r3" style={{ marginTop: '8px' }}>
                <div className="ef-f">
                  <label>Modelo *</label>
                  <input placeholder="Modelo" value={nuevoEquipo.modelo}
                    disabled={readOnly}
                    onChange={e => setNuevoEquipo({...nuevoEquipo, modelo: e.target.value.toUpperCase()})} required />
                </div>
                <div className="ef-f">
                  <label>Serie</label>
                  <input placeholder="Número de serie" value={nuevoEquipo.serie}
                    disabled={readOnly}
                    onChange={e => setNuevoEquipo({...nuevoEquipo, serie: e.target.value.toUpperCase()})} />
                </div>
                <div className="ef-f">
                  <label>Contador Páginas</label>
                  <input type="number" placeholder="Contador" value={nuevoEquipo.contador_pag}
                    disabled={readOnly}
                    onChange={e => setNuevoEquipo({...nuevoEquipo, contador_pag: e.target.value})} />
                </div>
              </div>
              <div className="ef-f" style={{ marginTop: '8px' }}>
                <label>Nivel Tintas</label>
                <input placeholder="Nivel de tintas" value={nuevoEquipo.nivel_tintas}
                  disabled={readOnly}
                  onChange={e => setNuevoEquipo({...nuevoEquipo, nivel_tintas: e.target.value.toUpperCase()})} />
              </div>
            </div>
            <div className="ef-s success">
              <div className="ef-st success">
                <span>Insumos</span>
                {insumosVisibles < 12 && !readOnly && (
                  <button type="button" className="ef-btn-a" onClick={() => setInsumosVisibles(insumosVisibles + 1)}>+ Agregar</button>
                )}
              </div>
              <div className="ef-ins">
                {insumos.slice(0, insumosVisibles).map((ins, idx) => (
                  <div key={idx} className="ef-ins-item">
                    <div>
                      <label>Insumo {idx + 1}</label>
                      <input placeholder={`Insumo ${idx + 1}`} value={ins.nombre}
                        disabled={readOnly}
                        onChange={e => actualizarInsumo(idx, e.target.value)} />
                    </div>
                    {!readOnly && (
                    <button type="button" className="ef-ins-del"
                      onClick={() => {
                        if (!window.confirm(`¿Eliminar insumo ${idx + 1}?`)) return;
                        const nuevas = insumos.filter((_, i) => i !== idx);
                        while (nuevas.length < 12) nuevas.push({ nombre: "" });
                        setInsumos(nuevas);
                        setInsumosVisibles(Math.max(2, insumosVisibles - 1));
                      }}><Trash2 size={14} /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="ef-s muted">
              <div className="ef-st muted">Avería/Falla/Incidencia</div>
              <div className="ef-f">
                <textarea placeholder="Descripción de falla o incidencia..." value={nuevoEquipo.averia}
                  disabled={readOnly}
                  onChange={e => setNuevoEquipo({...nuevoEquipo, averia: e.target.value.toUpperCase()})} rows={3} style={{ minHeight: '70px' }} />
              </div>
            </div>
            <div className="ef-s muted">
              <div className="ef-st muted">Actividad</div>
              <div className="ef-f">
                <textarea placeholder="Descripción de actividad realizada..." value={nuevoEquipo.actividad}
                  disabled={readOnly}
                  onChange={e => setNuevoEquipo({...nuevoEquipo, actividad: e.target.value.toUpperCase()})} rows={3} style={{ minHeight: '70px' }} />
              </div>
            </div>
            <div className="ef-s muted">
              <div className="ef-st muted">Observaciones</div>
              <div className="ef-f">
                <textarea placeholder="Observaciones adicionales..." value={nuevoEquipo.observaciones}
                  disabled={readOnly}
                  onChange={e => setNuevoEquipo({...nuevoEquipo, observaciones: e.target.value.toUpperCase()})} rows={3} style={{ minHeight: '70px' }} />
              </div>
            </div>
            <div className="ef-sub">
              {readOnly ? (
                <button type="button" className="ef-btn-c" onClick={onCancel}><X size={18} /> Cerrar</button>
              ) : (
                <>
                  <button type="button" className="ef-btn-c" onClick={onCancel}><X size={18} /> Cancelar</button>
                  <button type="submit" className="ef-btn-p"><Save size={18} /> {equipoEditando ? "Guardar Cambios" : "Guardar Equipo"}</button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EquipoFormulario;
