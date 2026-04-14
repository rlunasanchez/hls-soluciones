-- Tabla de equipos para autocomplete
CREATE TABLE IF NOT EXISTS equipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(100) NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar equipos iniciales
INSERT INTO equipos (tipo, marca, modelo) VALUES
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
('Monitor', 'LG', 'Flatron');