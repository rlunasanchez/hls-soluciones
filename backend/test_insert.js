import mysql from "mysql2/promise";
import assert from "assert";

const test = async () => {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "6498",
    database: "soporte_tecnico_db"
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