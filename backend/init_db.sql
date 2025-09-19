-- backend/init_db.sql

-- Crear roles base
INSERT INTO roles (nombre, descripcion)
VALUES 
    ('jefe', 'Jefe de turno 24/7'),
    ('operador', 'Operador de turno 24/7'),
    ('emc', 'EMC - Horario de oficina')
ON CONFLICT (nombre) DO NOTHING;