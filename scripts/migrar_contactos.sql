-- Migración: Crear tabla clientes_contactos y migrar datos existentes
-- Fecha: Julio 2026

-- 1. Crear tabla clientes_contactos
CREATE TABLE IF NOT EXISTS clientes_contactos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  nombre VARCHAR(100),
  email VARCHAR(100),
  fono VARCHAR(20),
  cargo VARCHAR(100),
  direccion VARCHAR(255),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- 2. Migrar contactos existentes (solo si tienen datos)
INSERT INTO clientes_contactos (cliente_id, nombre, email, fono, cargo, direccion)
SELECT id, contacto_nombre, contacto_email, contacto_fono, contacto_cargo, contacto_direccion
FROM clientes
WHERE contacto_nombre IS NOT NULL AND contacto_nombre != '';
