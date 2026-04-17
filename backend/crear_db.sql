-- Script para crear la base de datos y tabla usuarios
CREATE DATABASE IF NOT EXISTS soporte_tecnico_db;
USE soporte_tecnico_db;

-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razon_social VARCHAR(255) NOT NULL,
  giro VARCHAR(100),
  rut VARCHAR(20),
  direccion VARCHAR(255),
  ciudad VARCHAR(100),
  comuna VARCHAR(100),
  telefono VARCHAR(20),
  contacto_nombre VARCHAR(100),
  contacto_email VARCHAR(100),
  contacto_fono VARCHAR(20),
  contacto_cargo VARCHAR(100),
  contacto_direccion VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla direcciones/sucursales de clientes
CREATE TABLE IF NOT EXISTS clientes_direcciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  tipo_direccion VARCHAR(50),
  direccion VARCHAR(255),
  fono VARCHAR(20),
  ciudad VARCHAR(100),
  comuna VARCHAR(100),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'tecnico') DEFAULT 'tecnico',
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuario admin (password: admin123)
INSERT INTO usuarios (usuario, password, rol, email, activo) 
VALUES ('admin', '$2b$10$aU9gGKL5F3GUHLjgA56FIOre7lBKK85wddtqaXROgflL/lT2BgEYG', 'admin', 'admin@test.com', true);