import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "6498",
  database: "soporte_tecnico_db"
});

async function verificar() {
  const [rows] = await pool.query("SELECT id, equipo, insumo1, insumo2, insumo3, insumo4 FROM equipos");
  console.log(JSON.stringify(rows, null, 2));
  process.exit();
}

verificar();