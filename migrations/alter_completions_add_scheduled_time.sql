-- Agregar columna scheduled_time a la tabla completions existente
ALTER TABLE completions 
ADD COLUMN IF NOT EXISTS scheduled_time TEXT;

-- Eliminar el constraint UNIQUE anterior
ALTER TABLE completions 
DROP CONSTRAINT IF EXISTS completions_item_id_item_type_completed_date_key;

-- Agregar nuevo constraint UNIQUE que incluya scheduled_time
ALTER TABLE completions 
ADD CONSTRAINT completions_item_id_item_type_completed_date_scheduled_time_key 
UNIQUE(item_id, item_type, completed_date, scheduled_time);

-- Comentario para la nueva columna
COMMENT ON COLUMN completions.scheduled_time IS 'Horario específico (HH:mm) para medicamentos y ejercicios que se dan múltiples veces al día';
