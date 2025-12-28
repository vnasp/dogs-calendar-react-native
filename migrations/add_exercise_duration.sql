-- Agregar columnas de duración a la tabla exercises
-- Estas columnas permiten definir si un ejercicio es permanente o temporal

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS start_date TEXT NOT NULL DEFAULT (CURRENT_DATE::TEXT);

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT true;

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS duration_weeks INTEGER;

ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS end_date TEXT;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN exercises.start_date IS 'Fecha de inicio del tratamiento (formato YYYY-MM-DD)';
COMMENT ON COLUMN exercises.is_permanent IS 'Si es verdadero, el ejercicio es permanente. Si es falso, tiene duración limitada';
COMMENT ON COLUMN exercises.duration_weeks IS 'Duración en semanas (solo aplica si is_permanent es falso)';
COMMENT ON COLUMN exercises.end_date IS 'Fecha de finalización calculada (formato YYYY-MM-DD, solo si is_permanent es falso)';
