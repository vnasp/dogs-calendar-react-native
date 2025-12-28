-- Tabla para registrar tareas completadas
-- Permite tracking de quién completó cada tarea y cuándo
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('medication', 'exercise', 'appointment')),
  item_id UUID NOT NULL,
  scheduled_time TEXT, -- Horario específico (HH:mm) para medicamentos y ejercicios que se dan múltiples veces al día
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_id, item_type, completed_date, scheduled_time)
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX idx_completions_item ON completions(item_id, item_type);
CREATE INDEX idx_completions_date ON completions(completed_date);
CREATE INDEX idx_completions_user ON completions(user_id);

-- Habilitar RLS
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver sus propias completions y las de usuarios con acceso compartido
CREATE POLICY "Users can view own and shared completions"
ON completions FOR SELECT
USING (
  user_id = auth.uid() 
  OR 
  user_id IN (
    SELECT owner_id FROM shared_access 
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
  OR
  user_id IN (
    SELECT shared_with_id FROM shared_access 
    WHERE owner_id = auth.uid() AND status = 'accepted'
  )
);

-- Policy: Los usuarios pueden crear sus propias completions
CREATE POLICY "Users can create own completions"
ON completions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: Los usuarios pueden eliminar sus propias completions
CREATE POLICY "Users can delete own completions"
ON completions FOR DELETE
USING (user_id = auth.uid());

-- Comentarios para documentación
COMMENT ON TABLE completions IS 'Registra cuando los usuarios completan tareas (medicaciones, ejercicios, citas)';
COMMENT ON COLUMN completions.item_type IS 'Tipo de tarea: medication, exercise, o appointment';
COMMENT ON COLUMN completions.item_id IS 'ID de la tarea completada';
COMMENT ON COLUMN completions.completed_date IS 'Fecha en que se completó (permite múltiples completions por día si aplica)';
COMMENT ON COLUMN completions.completed_at IS 'Timestamp exacto de cuando se marcó como completado';
