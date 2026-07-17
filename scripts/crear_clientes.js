import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: new URL('../backend/.env', import.meta.url).pathname });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "soporte_tecnico_db"
});

async function crearTabla() {
  await pool.query("DROP TABLE IF EXISTS clientes_direcciones");
  await pool.query("DROP TABLE IF EXISTS clientes");
  await pool.query(`
    CREATE TABLE clientes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      razon_social VARCHAR(200) NOT NULL,
      giro VARCHAR(200),
      rut VARCHAR(20),
      direccion VARCHAR(255),
      ciudad VARCHAR(100),
      comuna VARCHAR(100),
      telefono VARCHAR(50),
      contacto_nombre VARCHAR(100),
      contacto_email VARCHAR(100),
      contacto_fono VARCHAR(50),
      contacto_cargo VARCHAR(100),
      contacto_direccion VARCHAR(255),
      activo BOOLEAN DEFAULT TRUE,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE clientes_direcciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cliente_id INT NOT NULL,
      tipo_direccion VARCHAR(50),
      direccion VARCHAR(255),
      fono VARCHAR(50),
      ciudad VARCHAR(100),
      comuna VARCHAR(100),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    )
  `);
  console.log("Tablas clientes y clientes_direcciones creadas");
  process.exit();
}

crearTabla();