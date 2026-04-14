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
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/usuarios', { replace: true });
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
      navigate('/usuarios');

    } catch (err) {
      setError(err.response?.data?.msg || 'Usuario o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <div className='auth-header'>
          <div className='logo'>
            <Shield size={32} color="white" />
          </div>
          <h2>Sistema de Soporte Técnico</h2>
          <p>Ingrese sus credenciales para acceder</p>
        </div>

        <form onSubmit={ingresar} className='auth-form'>
          <div className='form-group input-with-icon'>
            <label>Usuario</label>
            <User className='input-icon' size={20} />
            <input
              type="text"
              placeholder='Ingrese su usuario'
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={cargando}
            />
          </div>

          <div className='form-group input-with-icon'>
            <label>Contraseña</label>
            <Lock className='input-icon' size={20} />
            <input
              type={mostrarPassword ? 'text' : 'password'}
              placeholder='Ingrese su contraseña'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={cargando}
            />
            <button
              type='button'
              className='toggle-password'
              onClick={() => setMostrarPassword(!mostrarPassword)}
            >
              {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <p className='error-message'>{error}</p>}

          <button 
            type='submit' 
            className='main-btn'
            disabled={cargando}
          >
            {cargando ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>

        <p className='auth-footer'>
          © {new Date().getFullYear()} HLS Soluciones Informáticas
        </p>
      </div>
    </div>
  );
}

export default Login;