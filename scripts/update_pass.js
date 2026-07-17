import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: new URL('../backend/.env', import.meta.url).pathname });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "soporte_tecnico_db"
});

async function updatePassword() {
  const hash = "$2b$10$3XcxVr3pnzgPKsfq7jmkJuilEuCHWdMDqmsVD61ssKBvDYRMzslri";
  await pool.query("UPDATE usuarios SET password = ? WHERE usuario = ?", [hash, "admin"]);
  console.log("Password actualizado");
  process.exit();
}

updatePassword();