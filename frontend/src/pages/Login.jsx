import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const ingresar = async (e) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      setError('Por favor ingrese usuario y contraseña');
      return;
    }
    setCargando(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { usuario, password });
      localStorage.setItem('token', res.data.token);
      setCargando(false);
      window.location.replace('/home');
    } catch (err) {
      setError(err.response?.data?.msg || 'Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  const s = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient)', padding: '16px' },
    card: { background: 'white', borderRadius: '14px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '380px', overflow: 'hidden' },
    head: { background: 'var(--gradient)', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
    iconWrap: { width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    icon: { color: 'white' },
    h2: { color: 'white', margin: 0, fontSize: '18px', fontWeight: 600 },
    p: { color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '.78rem' },
    form: { padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' },
    field: { display: 'flex', flexDirection: 'column', gap: '3px' },
    label: { fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.3px' },
    inputWrap: { position: 'relative' },
    iconLeft: { position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' },
    input: { padding: '7px 34px 7px 34px', fontSize: '.82rem', border: '1.5px solid var(--border)', borderRadius: '7px', width: '100%', boxSizing: 'border-box', outline: 'none', background: 'white' },
    eyeBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' },
    error: { color: 'var(--danger)', background: 'var(--danger-light)', padding: '10px', borderRadius: '7px', margin: 0, fontSize: '.78rem' },
    btn: { padding: '9px 0', fontSize: '.85rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, marginTop: '2px', transition: 'all .2s' },
    footer: { textAlign: 'center', padding: '14px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '.75rem' }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.head}>
          <div style={s.iconWrap}><Shield size={24} style={s.icon} /></div>
          <h2 style={s.h2}>HLS Soluciones</h2>
          <p style={s.p}>Ingrese sus credenciales para acceder</p>
        </div>
        <form onSubmit={ingresar} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Usuario</label>
            <div style={s.inputWrap}>
              <User size={16} style={s.iconLeft} />
              <input type="text" placeholder="Ingrese su usuario" value={usuario}
                onChange={e => setUsuario(e.target.value)} disabled={cargando} style={s.input}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(37,99,235,.1)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }} />
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Contraseña</label>
            <div style={s.inputWrap}>
              <Lock size={16} style={s.iconLeft} />
              <input type={mostrarPassword ? 'text' : 'password'} placeholder="Ingrese su contraseña" value={password}
                onChange={e => setPassword(e.target.value)} disabled={cargando} style={s.input}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 2px rgba(37,99,235,.1)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }} />
              <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={s.eyeBtn}>
                {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" className="main-btn" disabled={cargando} style={s.btn}>
            {cargando ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>
        <div style={s.footer}>&copy; {new Date().getFullYear()} HLS Soluciones Inform&aacute;ticas</div>
      </div>
    </div>
  );
}

export default Login;
