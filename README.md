# Dogs Calendar React Native

## Instalación y configuración para iOS

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Prebuild del proyecto para iOS:

   ```bash
   npx expo prebuild --platform ios --clean
   ```

3. Instalar pods de iOS:

   ```bash
   cd ios && pod install --repo-update && cd ..
   ```

4. Abrir el workspace en Xcode:
   ```bash
   open ios/PewosApp.xcworkspace
   ```
