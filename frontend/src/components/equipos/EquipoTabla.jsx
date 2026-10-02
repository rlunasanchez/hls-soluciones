import EquipoAcciones from "./EquipoAcciones";

function EquipoTabla({ equipos, onVer, onEditar, onEliminar }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((eq) => (
            <tr key={eq.id}>
              <td data-label="Equipo">{eq.equipo}</td>
              <td data-label="Marca">{eq.marca}</td>
              <td data-label="Modelo">{eq.modelo}</td>
              <td data-label="Acciones">
                <EquipoAcciones equipo={eq} onVer={onVer} onEditar={onEditar} onEliminar={onEliminar} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EquipoTabla;
