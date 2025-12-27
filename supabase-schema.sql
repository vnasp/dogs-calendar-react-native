-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de perros
CREATE TABLE dogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  breed TEXT,
  birth_date TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  neutered BOOLEAN DEFAULT false,
  weight NUMERIC,
  photo_uri TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de citas/calendario
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vet', 'grooming', 'vaccine', 'other')),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  notification_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de medicamentos
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  end_date TEXT,
  times JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  notification_time TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de ejercicios
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('walk', 'run', 'play', 'training', 'other')),
  title TEXT NOT NULL,
  frequency INTEGER NOT NULL,
  duration_minutes INTEGER,
  scheduled_times JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  notification_time TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para compartir acceso entre usuarios
CREATE TABLE shared_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, shared_with_email)
);

-- Índices para mejorar rendimiento
CREATE INDEX dogs_user_id_idx ON dogs(user_id);
CREATE INDEX appointments_user_id_idx ON appointments(user_id);
CREATE INDEX appointments_dog_id_idx ON appointments(dog_id);
CREATE INDEX appointments_date_idx ON appointments(date);
CREATE INDEX medications_user_id_idx ON medications(user_id);
CREATE INDEX medications_dog_id_idx ON medications(dog_id);
CREATE INDEX medications_is_active_idx ON medications(is_active);
CREATE INDEX exercises_user_id_idx ON exercises(user_id);
CREATE INDEX exercises_dog_id_idx ON exercises(dog_id);
CREATE INDEX exercises_is_active_idx ON exercises(is_active);
CREATE INDEX shared_access_owner_id_idx ON shared_access(owner_id);
CREATE INDEX shared_access_shared_with_id_idx ON shared_access(shared_with_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_dogs_updated_at BEFORE UPDATE ON dogs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;

-- Políticas para dogs (el usuario puede ver sus propios perros o los compartidos con él)
CREATE POLICY "Users can view their own dogs"
ON dogs FOR SELECT
USING (
  user_id = auth.uid() 
  OR user_id IN (
    SELECT owner_id FROM shared_access 
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);

CREATE POLICY "Users can insert their own dogs"
ON dogs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own dogs"
ON dogs FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own dogs"
ON dogs FOR DELETE
USING (user_id = auth.uid());

-- Políticas para appointments
CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT owner_id FROM shared_access 
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);

CREATE POLICY "Users can insert their own appointments"
ON appointments FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own appointments"
ON appointments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own appointments"
ON appointments FOR DELETE
USING (user_id = auth.uid());

-- Políticas para medications
CREATE POLICY "Users can view their own medications"
ON medications FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT owner_id FROM shared_access 
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);

CREATE POLICY "Users can insert their own medications"
ON medications FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own medications"
ON medications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own medications"
ON medications FOR DELETE
USING (user_id = auth.uid());

-- Políticas para exercises
CREATE POLICY "Users can view their own exercises"
ON exercises FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id IN (
    SELECT owner_id FROM shared_access 
    WHERE shared_with_id = auth.uid() AND status = 'accepted'
  )
);

CREATE POLICY "Users can insert their own exercises"
ON exercises FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own exercises"
ON exercises FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own exercises"
ON exercises FOR DELETE
USING (user_id = auth.uid());

-- Políticas para shared_access
CREATE POLICY "Users can view their own shared access"
ON shared_access FOR SELECT
USING (owner_id = auth.uid() OR shared_with_id = auth.uid());

CREATE POLICY "Users can create shared access"
ON shared_access FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own shared access"
ON shared_access FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Shared users can update their access status"
ON shared_access FOR UPDATE
USING (shared_with_id = auth.uid())
WITH CHECK (shared_with_id = auth.uid());

CREATE POLICY "Users can delete their own shared access"
ON shared_access FOR DELETE
USING (owner_id = auth.uid());
