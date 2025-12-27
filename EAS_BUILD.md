# EAS Build - Guía de Distribución

## 📦 Configuración inicial

### 1. Instalar EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login en Expo
```bash
eas login
```
Usa tu cuenta de Expo (crea una gratis en expo.dev si no tienes)

### 3. Configurar el proyecto
```bash
eas build:configure
```

## 🍎 iOS - TestFlight (Recomendado)

### Opción 1: Build para TestFlight (Gratis, hasta 100 testers)

**Requisitos:**
- Cuenta de Apple Developer ($99/año)
- App Store Connect configurado

**Pasos:**

1. **Primera vez - Crear el proyecto:**
```bash
eas build --platform ios --profile production
```

2. **Subir a TestFlight:**
```bash
eas submit --platform ios
```

3. **Invitar a tu pareja:**
   - Ve a App Store Connect
   - TestFlight → Agregar testers internos
   - Envía invitación por email
   - Tu pareja descarga TestFlight y acepta

### Opción 2: Build para simulador (Desarrollo)
```bash
eas build --platform ios --profile development
```

## 🤖 Android - APK Directo (Más simple)

### Build APK para instalar directamente

```bash
eas build --platform android --profile preview
```

Esto genera un APK que puedes:
1. Descargar desde el link que te da EAS
2. Enviar por WhatsApp/email a tu pareja
3. Instalar directamente (activar "Instalar apps desconocidas" en Android)

### Play Store (Opcional, si quieres publicarla)
```bash
eas build --platform android --profile production
eas submit --platform android
```

## 🚀 Comandos rápidos

### Build para ambas plataformas
```bash
eas build --platform all --profile preview
```

### Build solo Android (APK directo)
```bash
eas build --platform android --profile preview
```

### Build iOS para TestFlight
```bash
eas build --platform ios --profile production
```

## ⚙️ Variables de entorno

Las variables de `.env.local` se inyectan automáticamente en los builds gracias a la configuración en `eas.json`:

```json
"env": {
  "EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_KEY": "$EXPO_PUBLIC_SUPABASE_KEY"
}
```

**Importante:** Asegúrate de tener el `.env.local` configurado antes de hacer el build.

## 📱 Recomendación para uso personal (tú y tu pareja)

### Android (Más fácil):
1. `eas build --platform android --profile preview`
2. Descarga el APK
3. Compártelo por WhatsApp
4. Instala en ambos teléfonos
5. Ambos usan el mismo login de la app

**Ventajas:**
- ✅ No requiere cuentas de desarrollador
- ✅ Instalación directa
- ✅ Gratis
- ✅ Actualizaciones manuales (generas nuevo APK cuando quieras)

### iOS (Si tienen iPhone):
**Opción A - Sin cuenta de desarrollador ($0):**
- Usa Expo Go (limitaciones con notificaciones)

**Opción B - Con cuenta de desarrollador ($99/año):**
1. Configura Apple Developer account
2. `eas build --platform ios --profile production`
3. `eas submit --platform ios`
4. Invita desde TestFlight
5. Actualizaciones automáticas

## 🔄 Updates Over-The-Air (OTA)

Para actualizaciones menores SIN rebuild:
```bash
eas update
```

Esto permite actualizar el código JavaScript sin generar un nuevo build. No funciona para cambios nativos (nuevas dependencias, permisos, etc.).

## 📊 Monitorear builds
```bash
eas build:list
```

Ver el estado de tus builds en: https://expo.dev/accounts/[tu-cuenta]/projects/[tu-proyecto]/builds

## 🐛 Troubleshooting

**Error: "No Apple Developer account"**
- Necesitas cuenta de $99/año para iOS
- O usa Android APK que es gratis

**Error: "Missing credentials"**
- Ejecuta `eas credentials` para configurar

**Build muy lento:**
- Los builds cloud pueden tomar 10-20 minutos
- Considera plan paid para builds más rápidos

**APK no instala en Android:**
- Activa "Instalar apps desconocidas" en ajustes
- Configura permisos de instalación para el navegador/WhatsApp

---

## 💡 Mi recomendación para empezar:

```bash
# 1. Login
eas login

# 2. Build Android APK (lo más simple)
eas build --platform android --profile preview

# 3. Descarga e instala
# El comando te dará un link para descargar el APK
```

¿Necesitas más detalles sobre algún paso específico?
