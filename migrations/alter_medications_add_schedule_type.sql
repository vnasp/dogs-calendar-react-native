-- Modificar tabla medications para soportar dos tipos de programación

-- Agregar columna para tipo de programación
ALTER TABLE medications
  ADD COLUMN schedule_type TEXT NOT NULL DEFAULT 'hours'
    CHECK (schedule_type IN ('hours', 'meals'));

-- Agregar columna para IDs de comidas seleccionadas
ALTER TABLE medications
  ADD COLUMN meal_ids UUID[];

-- Hacer opcionales los campos que solo se usan con schedule_type='hours'
ALTER TABLE medications
  ALTER COLUMN frequency_hours DROP NOT NULL;

ALTER TABLE medications
  ALTER COLUMN start_time DROP NOT NULL;

-- Agregar constraint: si schedule_type='hours', frequency_hours y start_time son requeridos
-- si schedule_type='meals', meal_ids es requerido
ALTER TABLE medications
  ADD CONSTRAINT check_schedule_type_hours
    CHECK (
      (schedule_type = 'hours' AND frequency_hours IS NOT NULL AND start_time IS NOT NULL) OR
      (schedule_type = 'meals' AND meal_ids IS NOT NULL AND array_length(meal_ids, 1) > 0) OR
      schedule_type NOT IN ('hours', 'meals')
    );

-- Comentarios para documentación
COMMENT ON COLUMN medications.schedule_type IS 'Tipo de programación: "hours" (cada X horas) o "meals" (con comidas)';
COMMENT ON COLUMN medications.meal_ids IS 'Array de IDs de meal_times cuando schedule_type="meals"';

-- Migración de datos existentes
-- Todos los medicamentos existentes usan el sistema de horas
UPDATE medications 
SET schedule_type = 'hours' 
WHERE schedule_type IS NULL OR schedule_type = 'hours';
