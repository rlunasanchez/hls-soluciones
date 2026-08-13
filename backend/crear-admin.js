import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function crearAdmin() {
  try {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    
    await pool.query(
      `INSERT INTO usuarios (usuario, password, rol, email, activo)
       VALUES (?, ?, 'admin', ?, true)
       ON DUPLICATE KEY UPDATE password = VALUES(password), rol = 'admin', activo = true`,
      ['admin', passwordHash, process.env.ADMIN_EMAIL]
    );
    
    console.log('Admin creado/actualizado correctamente');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

crearAdmin();
