-- Crear tabla para horarios de comidas (flexible)
CREATE TABLE meal_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,           -- "Desayuno", "Almuerzo", "Merienda", "Cena", etc.
  time TIME NOT NULL,           -- '08:00'
  order_index INTEGER NOT NULL, -- 1, 2, 3, 4... para ordenar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Validaciones
  CONSTRAINT check_order_index_positive CHECK (order_index > 0),
  CONSTRAINT check_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Índice para búsquedas y ordenamiento
CREATE INDEX idx_meal_times_user_order ON meal_times(user_id, order_index);

-- Índice para búsquedas por usuario
CREATE INDEX idx_meal_times_user ON meal_times(user_id);

-- RLS policies
ALTER TABLE meal_times ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver sus propias comidas
CREATE POLICY "Users can view their own meal times"
  ON meal_times FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden insertar sus propias comidas
CREATE POLICY "Users can insert their own meal times"
  ON meal_times FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar sus propias comidas
CREATE POLICY "Users can update their own meal times"
  ON meal_times FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden eliminar sus propias comidas
CREATE POLICY "Users can delete their own meal times"
  ON meal_times FOR DELETE
  USING (auth.uid() = user_id);

-- Función para crear comidas default al registrarse un usuario
CREATE OR REPLACE FUNCTION create_default_meal_times()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear 3 comidas por default
  INSERT INTO meal_times (user_id, name, time, order_index) VALUES
    (NEW.id, 'Desayuno', '08:00', 1),
    (NEW.id, 'Almuerzo', '14:00', 2),
    (NEW.id, 'Cena', '20:00', 3);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear comidas default
CREATE TRIGGER on_auth_user_created_meal_times
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_meal_times();

-- Comentarios para documentación
COMMENT ON TABLE meal_times IS 'Horarios de comidas configurables por usuario para programar medicamentos';
COMMENT ON COLUMN meal_times.name IS 'Nombre personalizable de la comida (ej: Desayuno, Merienda)';
COMMENT ON COLUMN meal_times.time IS 'Hora de la comida en formato HH:MM';
COMMENT ON COLUMN meal_times.order_index IS 'Orden de la comida en el día (1, 2, 3, 4...)';
