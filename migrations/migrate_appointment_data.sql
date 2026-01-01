-- Script de migración de datos para actualización de citas
-- Ejecutar DESPUÉS de aplicar la migración add_appointments_recurrence.sql

-- Paso 1: Convertir tipos antiguos a nuevos
-- Convertir "radiografia" a "examenes"
UPDATE appointments 
SET type = 'examenes', 
    title = 'Exámenes',
    notes = COALESCE(
      CASE 
        WHEN notes IS NULL OR notes = '' THEN 'Radiografía'
        ELSE notes || E'\n\n' || 'Tipo original: Radiografía'
      END,
      'Radiografía'
    )
WHERE type = 'radiografia';

-- Convertir "prequirurgico" a "examenes"
UPDATE appointments 
SET type = 'examenes',
    title = 'Exámenes',
    notes = COALESCE(
      CASE 
        WHEN notes IS NULL OR notes = '' THEN 'Prequirúrgico'
        ELSE notes || E'\n\n' || 'Tipo original: Prequirúrgico'
      END,
      'Prequirúrgico'
    )
WHERE type = 'prequirurgico';

-- Paso 2: Establecer valores por defecto para nuevos campos
UPDATE appointments 
SET recurrence_pattern = 'none'
WHERE recurrence_pattern IS NULL;

-- Paso 3: Verificar resultados
SELECT 
  type,
  COUNT(*) as cantidad,
  COUNT(DISTINCT dog_id) as perros_diferentes
FROM appointments
GROUP BY type
ORDER BY cantidad DESC;

-- Mostrar citas que fueron migradas
SELECT 
  id,
  type,
  title,
  date,
  time,
  LEFT(notes, 50) as primeros_50_chars_notas
FROM appointments
WHERE type = 'examenes'
  AND (notes LIKE '%Tipo original: Radiografía%' 
       OR notes LIKE '%Tipo original: Prequirúrgico%')
ORDER BY date DESC
LIMIT 10;

-- Verificar que no queden tipos antiguos
SELECT COUNT(*) as citas_con_tipos_antiguos
FROM appointments
WHERE type IN ('radiografia', 'prequirurgico');
-- Debe retornar 0

COMMENT ON COLUMN appointments.recurrence_pattern IS 'Patrón de recurrencia: daily, weekly, biweekly, monthly, none. Valor por defecto: none';
