import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: new URL('../backend/.env', import.meta.url).pathname });

const test = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "soporte_tecnico_db"
  });
  
  try {
    const sql = "INSERT INTO equipos (equipo, modelo, marca) VALUES (?, ?, ?)";
    const values = ['eq', 'mo', 'ma'];
    console.log('Executing:', sql, 'with values:', values);
    const [r] = await connection.execute(sql, values);
    console.log('Result:', r);
    console.log('OK');
  } catch (e) {
    console.log('ERROR:', e.message);
  }
  await connection.end();
  process.exit();
};

test();