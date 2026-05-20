import { useState } from "react";
import { ChevronDown, Package, Edit, Trash2 } from "lucide-react";

function EquipoTabla({ equipos, busqueda, equiposExpandidos, setEquiposExpandidos, onEditar, onEliminar }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Equipo</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Serie</th>
            <th>Cliente</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((eq) => {
            const expandido = equiposExpandidos[eq.id];
            const insumosEquipo = [
              eq.insumo1, eq.insumo2, eq.insumo3, eq.insumo4, eq.insumo5, eq.insumo6,
              eq.insumo7, eq.insumo8, eq.insumo9, eq.insumo10, eq.insumo11, eq.insumo12
            ].filter(i => i && i.trim());
            return (
              <tr key={eq.id}>
                <td data-label="Código">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {busqueda && (
                      <span style={{ color: 'var(--primary)', transition: 'transform 0.2s', transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)', cursor: 'pointer' }}
                        onClick={() => setEquiposExpandidos(prev => ({ ...prev, [eq.id]: !prev[eq.id] }))}>
                        <ChevronDown size={16} />
                      </span>
                    )}
                    <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{eq.codigo || '-'}</span>
                  </div>
                </td>
                <td data-label="Equipo">{eq.equipo}</td>
                <td data-label="Marca">{eq.marca}</td>
                <td data-label="Modelo">{eq.modelo}</td>
                <td data-label="Serie">{eq.serie}</td>
                <td data-label="Cliente">{eq.cliente_codigo ? `${eq.cliente_codigo} - ${eq.cliente_nombre}` : '-'}</td>
                <td data-label="Acciones">
                  <div className="action-buttons">
                    <button className="table-btn edit-btn" onClick={() => onEditar(eq)}>
                      <Edit size={14} /> Editar
                    </button>
                    <button className="table-btn delete-btn" onClick={() => onEliminar(eq.id)}>
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default EquipoTabla;
