import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../backend/.env', import.meta.url).pathname });

async function crearAdmin() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'soporte_tecnico_db'
    });

    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const [result] = await pool.query(`
      INSERT INTO usuarios (usuario, password, rol, email, activo)
      VALUES ('admin', ?, 'admin', 'admin@hls.cl', true)
      ON DUPLICATE KEY UPDATE password = ?, rol = 'admin', activo = true
    `, [passwordHash, passwordHash]);
    
    console.log('Admin creado/actualizado en MySQL local');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

crearAdmin();