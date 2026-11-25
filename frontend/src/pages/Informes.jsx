import { FileText } from "lucide-react";
import HeaderModulo from "../components/comunes/HeaderModulo";

function Informes() {
  return (
    <div className="container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <HeaderModulo titulo="Informes Técnicos" Icono={FileText} />

      {/* Contenido principal */}
      <div className="page-content">
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: 'var(--shadow)',
          padding: 'clamp(20px, 4vw, 40px)',
          textAlign: 'center'
        }}>
          <FileText size={64} style={{ color: '#F97316', marginBottom: '24px' }} />
          <h2 style={{ color: 'var(--text)', marginBottom: '16px' }}>
            Mantenedor de Informes Técnicos
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            Aquí se gestionarán los informes técnicos del sistema.
          </p>
          
          {/* Aquí irán los campos que definirás después */}
          <div style={{ 
            border: '2px dashed var(--border)', 
            borderRadius: '12px', 
            padding: '40px',
            color: 'var(--text-muted)'
          }}>
            <p>Campos del mantenedor (se agregarán después)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Informes;
