import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: new URL('../backend/.env', import.meta.url).pathname });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "soporte_tecnico_db"
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