-- Agregar campos para recurrencia y tipo personalizado en appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS custom_type_description TEXT,
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'biweekly', 'monthly', 'none')),
ADD COLUMN IF NOT EXISTS recurrence_end_date TEXT,
ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES appointments(id) ON DELETE CASCADE;

-- Índice para mejorar rendimiento en búsqueda de citas recurrentes
CREATE INDEX IF NOT EXISTS appointments_recurrence_parent_id_idx ON appointments(recurrence_parent_id);

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN appointments.custom_type_description IS 'Descripción personalizada cuando el tipo es "otro"';
COMMENT ON COLUMN appointments.recurrence_pattern IS 'Patrón de recurrencia: daily, weekly, biweekly, monthly, none';
COMMENT ON COLUMN appointments.recurrence_end_date IS 'Fecha de fin para citas recurrentes (formato YYYY-MM-DD)';
COMMENT ON COLUMN appointments.recurrence_parent_id IS 'ID de la cita padre para citas generadas por recurrencia';
