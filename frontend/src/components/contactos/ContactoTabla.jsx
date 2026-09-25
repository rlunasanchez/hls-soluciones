import ContactoAcciones from "./ContactoAcciones";

function ContactoTabla({ contactos, onVer, onEditar, onEliminar }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Cargo</th>
            <th>Email</th>
            <th>Fono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {contactos.map((c) => (
            <tr key={c.id}>
              <td data-label="Código">
                <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{c.codigo || '-'}</span>
              </td>
              <td data-label="Nombre">{c.nombre}</td>
              <td data-label="Cargo">{c.cargo}</td>
              <td data-label="Email">{c.email}</td>
              <td data-label="Fono">{c.fono}</td>
              <td data-label="Acciones">
                <ContactoAcciones contacto={c} onVer={onVer} onEditar={onEditar} onEliminar={onEliminar} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ContactoTabla;
