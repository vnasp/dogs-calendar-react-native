-- Asegurar que el bucket dog-photos existe y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog-photos', 'dog-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Crear política de lectura pública (CRÍTICO para ver las imágenes)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'dog-photos');

-- Crear política para que usuarios autenticados puedan subir
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dog-photos');

-- Crear política para que usuarios puedan actualizar sus propias imágenes
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'dog-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Crear política para que usuarios puedan eliminar sus propias imágenes
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dog-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
