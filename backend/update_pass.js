import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "6498",
  database: "soporte_tecnico_db"
});

async function updatePassword() {
  const hash = "$2b$10$3XcxVr3pnzgPKsfq7jmkJuilEuCHWdMDqmsVD61ssKBvDYRMzslri";
  await pool.query("UPDATE usuarios SET password = ? WHERE usuario = ?", [hash, "admin"]);
  console.log("Password actualizado");
  process.exit();
}

updatePassword();