import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: new URL('../backend/.env', import.meta.url).pathname });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "soporte_tecnico_db"
});

const equipos = [
  ['Impresora Termica', 'Sewoo', 'LK-T200'],
  ['Impresora Termica', 'Sewoo', 'LK-T300'],
  ['Impresora Matriz', 'Olivetti', 'PR2-PLUS'],
  ['Scanner', 'SmartSource', 'SSP1'],
  ['Lector de cheque', 'Uniform', '8310-50KR USB'],
  ['Impresora Laser', 'HP', 'LaserJet Pro'],
  ['Impresora Laser', 'Brother', 'HL-L2350DW'],
  ['Computador', 'Dell', 'Optiplex'],
  ['Computador', 'HP', 'ProDesk'],
  ['Monitor', 'Samsung', 'SyncMaster'],
  ['Monitor', 'LG', 'Flatron']
];

async function insertar() {
  for (const eq of equipos) {
    await pool.query("INSERT INTO equipos (tipo, marca, modelo) VALUES (?, ?, ?)", eq);
  }
  console.log("Equipos insertados");
  process.exit();
}

insertar();