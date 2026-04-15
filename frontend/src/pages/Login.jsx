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
      const res = await api.post('/api/auth/login', {
        usuario,
        password
      });

      localStorage.setItem('token', res.data.token);
      setCargando(false);
      window.location.replace('/home');

    } catch (err) {
      setError(err.response?.data?.msg || 'Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--gradient)',
      padding: '20px'
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '16px', 
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '420px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          background: 'var(--gradient)', 
          padding: '32px', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={32} color="white" />
          </div>
          <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>HLS Soluciones</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Ingrese sus credenciales para acceder</p>
        </div>

        <form onSubmit={ingresar} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className='form-group' style={{ margin: 0 }}>
            <label>Usuario</label>
            <div style={{ position: 'relative' }}>
              <User style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
              <input
                type="text"
                placeholder='Ingrese su usuario'
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={cargando}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className='form-group' style={{ margin: 0 }}>
            <label>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
              <input
                type={mostrarPassword ? 'text' : 'password'}
                placeholder='Ingrese su contraseña'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={cargando}
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
              />
              <button
                type='button'
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ 
              color: 'var(--danger)', 
              background: 'var(--danger-light)', 
              padding: '12px', 
              borderRadius: '8px',
              margin: 0,
              fontSize: '14px'
            }}>{error}</p>
          )}

          <button 
            type='submit' 
            className='main-btn'
            disabled={cargando}
            style={{ marginTop: '8px' }}
          >
            {cargando ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontSize: '14px'
        }}>
          © {new Date().getFullYear()} HLS Soluciones Informáticas
        </div>
      </div>
    </div>
  );
}

export default Login;