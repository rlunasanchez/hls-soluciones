import { useState } from "react";
import { Lock, Save, ArrowLeft, X } from "lucide-react";

const ufCss = `.uf-wrap{background:white;border-radius:16px;box-shadow:var(--shadow-lg);overflow:hidden}
.uf-head{background:var(--gradient);padding:16px 20px;display:flex;align-items:center;justify-content:space-between}
.uf-head h2{color:white;margin:0;display:flex;align-items:center;gap:10px;font-size:17px;font-weight:600}
.uf-head-close{background:rgba(255,255,255,0.2);border:none;border-radius:8px;padding:7px;cursor:pointer;color:white;display:flex}
.uf-form{padding:16px;display:grid;gap:12px}
.uf-s{padding:12px;border-radius:10px;background:var(--primary-light)}
.uf-st{font-size:13px;font-weight:600;color:var(--primary);margin-bottom:10px}
.uf-r2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.uf-f{display:flex;flex-direction:column;gap:2px}
.uf-f label{font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.3px}
.uf-f input{padding:5px 8px;font-size:.78rem;border:1.5px solid var(--border);border-radius:6px;background:white}
.uf-f input:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 2px rgba(37,99,235,.1)}
.uf-sub{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:2px}
.uf-btn-p{padding:7px 16px;font-size:.8rem;background:var(--primary);color:white;border:none;border-radius:7px;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:6px}
.uf-btn-c{padding:7px 16px;font-size:.8rem;background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;border-radius:7px;cursor:pointer;font-weight:600;display:flex;align-items:center;gap:6px;transition:all .2s}
.uf-btn-c:hover{background:#e2e8f0}
@media(max-width:768px){.uf-r2{grid-template-columns:1fr}.uf-form{padding:12px;gap:10px}.uf-f input{padding:10px 12px;font-size:.9rem;min-height:44px}.uf-sub{flex-direction:column}.uf-sub button{width:100%;justify-content:center}}`;

function CambioPasswordForm({ onSave, onCancel }) {
  const [cambioPassword, setCambioPassword] = useState({
    passwordActual: "",
    nuevaPassword: "",
    confirmarPassword: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cambioPassword.nuevaPassword !== cambioPassword.confirmarPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    onSave({
      passwordActual: cambioPassword.passwordActual,
      nuevaPassword: cambioPassword.nuevaPassword
    });
  };

  return (
    <><style>{ufCss}</style>
    <div className="container">
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
        <div className="uf-wrap">
          <div className="uf-head">
            <h2><Lock size={20} /> Cambiar Mi Contraseña</h2>
            <button type="button" className="uf-head-close" onClick={onCancel}><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="uf-form">
            <div className="uf-s">
              <div className="uf-st">Cambio de Contraseña</div>
              <div className="uf-r2">
                <div className="uf-f">
                  <label>Actual</label>
                  <input type="password" value={cambioPassword.passwordActual}
                    onChange={e => setCambioPassword({...cambioPassword, passwordActual: e.target.value})} required />
                </div>
                <div className="uf-f">
                  <label>Nueva</label>
                  <input type="password" value={cambioPassword.nuevaPassword}
                    onChange={e => setCambioPassword({...cambioPassword, nuevaPassword: e.target.value})} required />
                </div>
              </div>
              <div className="uf-f" style={{ marginTop: '8px' }}>
                <label>Confirmar Nueva</label>
                <input type="password" value={cambioPassword.confirmarPassword}
                  onChange={e => setCambioPassword({...cambioPassword, confirmarPassword: e.target.value})} required />
              </div>
            </div>
            <div className="uf-sub">
              <button type="button" className="uf-btn-c" onClick={onCancel}><ArrowLeft size={16} /> Cancelar</button>
              <button type="submit" className="uf-btn-p"><Save size={16} /> Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div></>
  );
}

export default CambioPasswordForm;
