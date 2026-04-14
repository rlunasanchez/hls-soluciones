-- Script para crear la base de datos y tabla usuarios
CREATE DATABASE IF NOT EXISTS soporte_tecnico_db;
USE soporte_tecnico_db;

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