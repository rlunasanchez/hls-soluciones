function OrdenFormAveria({ nuevaOrden, setNuevaOrden }) {
  return (
    <div className="of-sec muted">
      <div className="of-st muted">Avería/Falla/Incidencia</div>
      <div className="of-f">
        <textarea
          placeholder="Describa la avería, falla o incidencia del equipo..."
          value={nuevaOrden.averia}
          onChange={(e) => setNuevaOrden({...nuevaOrden, averia: e.target.value})}
          rows={3}
        />
      </div>

      <div className="of-st muted">Actividad</div>
      <div className="of-f">
        <textarea
          placeholder="Describa la actividad realizada..."
          value={nuevaOrden.actividad}
          onChange={(e) => setNuevaOrden({...nuevaOrden, actividad: e.target.value})}
          rows={3}
        />
      </div>

      <div className="of-st muted">Observaciones</div>
      <div className="of-f">
        <textarea
          placeholder="Observaciones adicionales..."
          value={nuevaOrden.observaciones}
          onChange={(e) => setNuevaOrden({...nuevaOrden, observaciones: e.target.value})}
          rows={3}
        />
      </div>
    </div>
  );
}

export default OrdenFormAveria;
