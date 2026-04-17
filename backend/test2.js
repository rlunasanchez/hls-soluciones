import pool from './config/db.js';

const test = async () => {
  const vals = ['eq', 'mo', 'ma', 'se', '0', 'ni', 'i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7', 'i8', 'i9', 'i10', 'i11', 'i12', 'av'];
  const sql = "INSERT INTO equipos (equipo, modelo, marca, serie, contador_pag, nivel_tintas, insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8, insumo9, insumo10, insumo11, insumo12, averia) VALUES (" + vals.map(() => '?').join(',') + ")";
  
  console.log('Testing SQL:', sql);
  console.log('Values count:', vals.length);
  
  try {
    await pool.query(sql, vals);
    console.log('OK');
  } catch (e) {
    console.log('ERROR:', e.message);
  }
  process.exit();
};

test();