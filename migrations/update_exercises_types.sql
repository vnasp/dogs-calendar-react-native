-- Actualizar los tipos de ejercicio a español y nuevos tipos
-- Primero, eliminar la constraint antigua
ALTER TABLE exercises DROP CONSTRAINT exercises_type_check;

-- Crear la nueva constraint con los tipos en español
ALTER TABLE exercises ADD CONSTRAINT exercises_type_check 
  CHECK (type IN ('caminata', 'cavaletti', 'balanceo', 'slalom', 'entrenamiento', 'otro'));

-- Migrar datos existentes (si los hay)
-- walk -> caminata
-- run -> caminata (ya no existe run, se convierte en caminata)
-- play -> entrenamiento (play se convierte en entrenamiento)
-- training -> entrenamiento
-- other -> otro

UPDATE exercises SET type = 'caminata' WHERE type = 'walk';
UPDATE exercises SET type = 'caminata' WHERE type = 'run';
UPDATE exercises SET type = 'entrenamiento' WHERE type = 'play';
UPDATE exercises SET type = 'entrenamiento' WHERE type = 'training';
UPDATE exercises SET type = 'otro' WHERE type = 'other';
