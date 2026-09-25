import ContactoAcciones from "./ContactoAcciones";

function ContactoCard({ contacto, onVer, onEditar, onEliminar }) {
  return (
    <div key={contacto.id} className="data-card">
      <div className="data-card-header">
        <strong>{contacto.codigo || contacto.nombre}</strong>
        {contacto.cargo && <span className="badge badge-info">{contacto.cargo}</span>}
      </div>
      <div className="data-card-row">
        <span className="data-card-label">Nombre</span>
        <span className="data-card-value">{contacto.nombre}</span>
      </div>
      {contacto.email && (
        <div className="data-card-row">
          <span className="data-card-label">Email</span>
          <span className="data-card-value">{contacto.email}</span>
        </div>
      )}
      {contacto.fono && (
        <div className="data-card-row">
          <span className="data-card-label">Fono</span>
          <span className="data-card-value">{contacto.fono}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        <ContactoAcciones contacto={contacto} onVer={onVer} onEditar={onEditar} onEliminar={onEliminar} />
      </div>
    </div>
  );
}

export default ContactoCard;
