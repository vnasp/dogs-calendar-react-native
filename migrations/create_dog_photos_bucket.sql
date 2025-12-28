-- Crear bucket para fotos de perros en Supabase Storage
-- Ejecutar esto en el SQL Editor de Supabase

-- 1. Crear el bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('dog-photos', 'dog-photos', true);

-- 2. Crear política de lectura pública (cualquiera puede ver las fotos)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'dog-photos');

-- 3. Crear política de subida (solo usuarios autenticados pueden subir)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dog-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Crear política de actualización (solo el propietario puede actualizar)
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dog-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Crear política de eliminación (solo el propietario puede eliminar)
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dog-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
