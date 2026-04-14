import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "6498",
  database: "soporte_tecnico_db"
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