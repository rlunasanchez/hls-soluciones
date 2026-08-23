// Verifica y agrega columnas faltantes en la BD local (MySQL)
// Uso: node ..\scripts\migrar-columnas-faltantes.js   (desde backend/)
const path = require('path');
const backend = path.join(__dirname, '..', 'backend');
require(path.join(backend, 'node_modules', 'dotenv')).config({
  path: path.join(backend, '.env'),
});
const mysql = require(path.join(backend, 'node_modules', 'mysql2', 'promise'));

const ESPERADAS = {
  ordenes_trabajo: [
    ['rut', "VARCHAR(20)"],
    ['actividad', "TEXT"],
    ['observaciones', "TEXT"],
    ['info_interna', "TEXT"],
    ['adjunto', "LONGTEXT"],
    ['contactos_extra', "TEXT"],
    ['direcciones_extra', "TEXT"],
  ],
  clientes: [
    ['codigo', "VARCHAR(50)"],
    ['email', "VARCHAR(255)"],
  ],
  equipos: [
    ['codigo', "VARCHAR(50)"],
    ['actividad', "TEXT"],
    ['observaciones', "TEXT"],
  ],
};

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  let cambios = 0;
  for (const [tabla, columnas] of Object.entries(ESPERADAS)) {
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      [process.env.DB_NAME, tabla]
    );
    const existentes = new Set(rows.map((r) => r.COLUMN_NAME));
    for (const [col, def] of columnas) {
      if (!existentes.has(col)) {
        await connection.query(`ALTER TABLE \`${tabla}\` ADD COLUMN \`${col}\` ${def}`);
        console.log(`[+] ${tabla}.${col} agregada (${def})`);
        cambios++;
      } else {
        console.log(`[=] ${tabla}.${col} ya existe`);
      }
    }
  }

  console.log(cambios ? `\n${cambios} columna(s) agregada(s).` : '\nNo faltaba ninguna columna.');
  await connection.end();
})().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
