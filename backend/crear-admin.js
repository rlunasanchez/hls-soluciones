import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_fgic5sYlSoz9@ep-cold-art-acx567jp-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function crearAdmin() {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const result = await pool.query(`
      INSERT INTO usuarios (usuario, password, rol, email, activo)
      VALUES ('admin', $1, 'admin', 'admin@hls.cl', true)
      ON CONFLICT (usuario) DO UPDATE SET password = $1, rol = 'admin', activo = true
      RETURNING id, usuario, rol
    `, [passwordHash]);
    
    console.log('Admin creado/actualizado:', result.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

crearAdmin();