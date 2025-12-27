# Configuración de Supabase

## ✅ Completado

La app ha sido migrada exitosamente de AsyncStorage a Supabase. Ahora los datos se sincronizan en la nube y puedes compartir la información con tu pareja.

## 📋 Pasos para configurar

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta (gratis)
3. Crea un nuevo proyecto
4. Guarda:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: La clave pública (empieza con `eyJ...`)

### 2. Configurar variables de entorno

Ya tienes el archivo `.env.local`, asegúrate que contenga:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Ejecutar el esquema SQL

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Crea una **New Query**
3. Copia todo el contenido del archivo `supabase-schema.sql`
4. Haz clic en **Run**

Esto creará todas las tablas necesarias:

- `dogs` - Información de los perros
- `appointments` - Citas y eventos
- `medications` - Medicamentos
- `exercises` - Rutinas de ejercicio
- `shared_access` - Para compartir con tu pareja

### 4. Habilitar autenticación por email

1. En Supabase, ve a **Authentication** → **Providers**
2. Asegúrate que **Email** esté habilitado
3. Desactiva "Confirm email" si quieres registro inmediato (recomendado para uso personal)

## 🚀 Cómo usar

### Primera vez

1. Abre la app
2. Crea una cuenta con tu email y contraseña
3. Agrega tus perros y datos

### Compartir con tu pareja

**Opción 1: Misma cuenta (Recomendado para uso en pareja)**

- Ambos usan el mismo email/contraseña
- Todos los datos se sincronizan automáticamente
- Lo más simple para 2 personas

**Opción 2: Cuentas separadas con compartir (Futuro)**

- Cada uno tiene su propia cuenta
- Puedes invitar a tu pareja desde la app
- Requiere implementar UI de compartir (no incluida aún)

## 🔧 Cambios realizados

### Archivos nuevos:

- ✅ `context/AuthContext.tsx` - Manejo de autenticación
- ✅ `screens/LoginScreen.tsx` - Pantalla de login/registro
- ✅ `utils/supabase.ts` - Configuración de Supabase
- ✅ `supabase-schema.sql` - Esquema de base de datos

### Archivos modificados:

- ✅ `App.tsx` - Integrado flujo de autenticación
- ✅ `context/DogsContext.tsx` - Migrado a Supabase
- ✅ `context/CalendarContext.tsx` - Migrado a Supabase
- ✅ `context/MedicationContext.tsx` - Migrado a Supabase
- ✅ `context/ExerciseContext.tsx` - Migrado a Supabase

### Características:

- ✅ Row Level Security (RLS) - Cada usuario solo ve sus datos
- ✅ Sincronización en tiempo real
- ✅ Sistema de compartir preparado
- ✅ Todas las notificaciones funcionan igual que antes
- ✅ Interfaz de usuario sin cambios (excepto pantalla de login)

## 🐛 Solución de problemas

**No puedo registrarme:**

- Verifica que las variables de entorno estén correctas
- Asegúrate que el esquema SQL se ejecutó correctamente

**No veo mis datos:**

- Verifica que estás usando la misma cuenta
- Revisa la consola para errores

**Error de conexión:**

- Verifica tu conexión a internet
- Confirma que la URL de Supabase es correcta

## 📱 Distribución

Para compartir la app con tu pareja:

### iOS (TestFlight):

```bash
eas build --platform ios
eas submit --platform ios
```

### Android (APK directo):

```bash
eas build --platform android --profile preview
```

Comparte el APK descargado directamente.

---

¿Necesitas ayuda? Revisa la [documentación de Supabase](https://supabase.com/docs)
