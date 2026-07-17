import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: new URL('../backend/.env', import.meta.url).pathname });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "soporte_tecnico_db"
});

async function verificar() {
  const [rows] = await pool.query("SELECT id, equipo, insumo1, insumo2, insumo3, insumo4 FROM equipos");
  console.log(JSON.stringify(rows, null, 2));
  process.exit();
}

verificar();