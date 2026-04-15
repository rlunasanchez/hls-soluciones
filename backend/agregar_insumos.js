import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "6498",
  database: "soporte_tecnico_db"
});

async function agregarColumnas() {
  try {
    for (let i = 3; i <= 12; i++) {
      await pool.query(`ALTER TABLE equipos ADD COLUMN insumo${i} VARCHAR(100) AFTER insumo2`);
    }
    console.log("Columnas agregadas");
  } catch (err) {
    console.error(err.message);
  }
  process.exit();
}

agregarColumnas();