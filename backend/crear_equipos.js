import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "6498",
  database: "soporte_tecnico_db"
});

async function crearTabla() {
  await pool.query("DROP TABLE IF EXISTS equipos");
  await pool.query(`
    CREATE TABLE equipos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      equipo VARCHAR(100) NOT NULL,
      modelo VARCHAR(100) NOT NULL,
      marca VARCHAR(100) NOT NULL,
      serie VARCHAR(100),
      contador_pag INT DEFAULT 0,
      nivel_tintas VARCHAR(50),
      insumo1 VARCHAR(100),
      insumo2 VARCHAR(100),
      insumo3 VARCHAR(100),
      insumo4 VARCHAR(100),
      insumo5 VARCHAR(100),
      insumo6 VARCHAR(100),
      insumo7 VARCHAR(100),
      insumo8 VARCHAR(100),
      insumo9 VARCHAR(100),
      insumo10 VARCHAR(100),
      insumo11 VARCHAR(100),
      insumo12 VARCHAR(100),
      averia VARCHAR(255),
      activo BOOLEAN DEFAULT TRUE,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Tabla equipos creada");
  process.exit();
}

crearTabla();