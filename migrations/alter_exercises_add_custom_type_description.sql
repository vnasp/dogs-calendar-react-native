-- Agregar columna para descripción personalizada del tipo de ejercicio

ALTER TABLE exercises
  ADD COLUMN custom_type_description TEXT;

-- Comentario para documentación
COMMENT ON COLUMN exercises.custom_type_description IS 'Descripción personalizada cuando type es "otro"';
