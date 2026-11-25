import { ShoppingCart } from "lucide-react";
import HeaderModulo from "../components/comunes/HeaderModulo";

function OrdenCompra() {
  return (
    <div className="container" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <HeaderModulo titulo="Orden de Compra" Icono={ShoppingCart} />

      {/* Contenido principal */}
      <div className="page-content">
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: 'var(--shadow)',
          padding: 'clamp(20px, 4vw, 40px)',
          textAlign: 'center'
        }}>
          <ShoppingCart size={64} style={{ color: '#1E40AF', marginBottom: '24px' }} />
          <h2 style={{ color: 'var(--text)', marginBottom: '16px' }}>
            Mantenedor de Orden de Compra
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            Aquí se gestionarán las órdenes de compra del sistema.
          </p>
          
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

export default OrdenCompra;
