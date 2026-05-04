-- Script completo para crear la base de datos: soporte_tecnico_db
-- Ejecutar en MySQL/MariaDB

CREATE DATABASE IF NOT EXISTS soporte_tecnico_db;
USE soporte_tecnico_db;

-- ============================================
-- TABLA DE USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'tecnico') DEFAULT 'tecnico',
  email VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuario admin por defecto (password: admin123)
INSERT INTO usuarios (usuario, password, rol, email, activo) 
VALUES ('admin', '$2b$10$aU9gGKL5F3GUHLjgA56FIOre7lBKK85wddtqaXROgflL/lT2BgEYG', 'admin', 'admin@hls.com', true)
ON DUPLICATE KEY UPDATE usuario=usuario;

-- ============================================
-- TABLA DE CLIENTES
-- ============================================
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

-- ============================================
-- TABLA DE DIRECCIONES/SUCURSALES DE CLIENTES
-- ============================================
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

-- ============================================
-- TABLA DE EQUIPOS (Mantenedor)
-- ============================================
CREATE TABLE IF NOT EXISTS equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  equipo VARCHAR(100) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  serie VARCHAR(100),
  contador_pag INT DEFAULT 0,
  nivel_tintas VARCHAR(100),
  insumo1 VARCHAR(100),
  insumo2 VARCHAR(100),
  insumo3 VARCHAR(100),
  insumo4 VARCHAR(100),
  insumo5 VARCHAR(100),
  insumo6 VARCHAR(100),
  insumo7 VARCHAR(100),
  insumo8 VARCHAR(100),
  insumo9 VARCHAR(100),
  insumo10 VARCHAR(100),
  insumo11 VARCHAR(100),
  insumo12 VARCHAR(100),
  averia TEXT,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar equipos iniciales
INSERT INTO equipos (equipo, marca, modelo) VALUES
('Impresora Termica', 'Sewoo', 'LK-T200'),
('Impresora Termica', 'Sewoo', 'LK-T300'),
('Impresora Matriz', 'Olivetti', 'PR2-PLUS'),
('Scanner', 'SmartSource', 'SSP1'),
('Lector de cheque', 'Uniform', '8310-50KR USB'),
('Impresora Laser', 'HP', 'LaserJet Pro'),
('Impresora Laser', 'Brother', 'HL-L2350DW'),
('Computador', 'Dell', 'Optiplex'),
('Computador', 'HP', 'ProDesk'),
('Monitor', 'Samsung', 'SyncMaster'),
('Monitor', 'LG', 'Flatron')
ON DUPLICATE KEY UPDATE modelo=modelo;

-- ============================================
-- TABLA DE ORDENES DE TRABAJO
-- ============================================
CREATE TABLE IF NOT EXISTS ordenes_trabajo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  
  -- Datos de la Orden
  numero_orden VARCHAR(50) NOT NULL UNIQUE,
  fecha DATE NOT NULL,
  es_garantia BOOLEAN DEFAULT FALSE,
  
  -- Fechas con checkbox
  fecha_ingreso DATE,
  fecha_ingreso_check BOOLEAN DEFAULT FALSE,
  fecha_termino DATE,
  fecha_termino_check BOOLEAN DEFAULT FALSE,
  fecha_entrega DATE,
  fecha_entrega_check BOOLEAN DEFAULT FALSE,
  fecha_compra DATE,
  fecha_compra_check BOOLEAN DEFAULT FALSE,
  
  -- Datos del Cliente
  cliente VARCHAR(200) NOT NULL,
  direccion VARCHAR(300),
  comuna VARCHAR(100),
  contacto VARCHAR(200),
  fono_principal VARCHAR(50),
  tecnico_asignado VARCHAR(200) NOT NULL,
  actividad TEXT,
  
  -- Datos del Equipo
  equipo VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  serie VARCHAR(100),
  contador_pag_out VARCHAR(50),
  nivel_tinta VARCHAR(100),
  
  -- Insumos (hasta 12)
  insumo1 VARCHAR(100),
  insumo2 VARCHAR(100),
  insumo3 VARCHAR(100),
  insumo4 VARCHAR(100),
  insumo5 VARCHAR(100),
  insumo6 VARCHAR(100),
  insumo7 VARCHAR(100),
  insumo8 VARCHAR(100),
  insumo9 VARCHAR(100),
  insumo10 VARCHAR(100),
  insumo11 VARCHAR(100),
  insumo12 VARCHAR(100),
  
  -- Averia/Falla/Incidencia
  averia TEXT,
  
  -- Relaciones (opcionales)
  cliente_id INT,
  equipo_id INT,
  
  -- Metadatos
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indices para busquedas frecuentes
  INDEX idx_numero_orden (numero_orden),
  INDEX idx_cliente (cliente),
  INDEX idx_fecha (fecha),
  INDEX idx_tecnico (tecnico_asignado),
  INDEX idx_serie (serie)
);

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. El buscador de equipos ahora funciona SOLO por SERIE
-- 2. En el formulario de Orden de Trabajo, los campos adicionales
--    (contador, nivel tinta, insumos, averia) están comentados
--    para facilitar futuras modificaciones
-- 3. En el mantenedor de equipos (Equipos.jsx) se mantiene
--    el formulario completo con todos los campos
-- 4. Usuario admin por defecto: admin / admin123
