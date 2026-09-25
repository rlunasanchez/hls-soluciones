import DireccionAcciones from "./DireccionAcciones";

function DireccionTabla({ direcciones, onVer, onEditar, onEliminar }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Dirección</th>
            <th>Ciudad</th>
            <th>Comuna</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {direcciones.map((d) => (
            <tr key={d.id}>
              <td data-label="Código">
                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{d.codigo || '-'}</span>
              </td>
              <td data-label="Dirección">{d.direccion}</td>
              <td data-label="Ciudad">{d.ciudad}</td>
              <td data-label="Comuna">{d.comuna}</td>
              <td data-label="Acciones">
                <DireccionAcciones direccion={d} onVer={onVer} onEditar={onEditar} onEliminar={onEliminar} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DireccionTabla;
