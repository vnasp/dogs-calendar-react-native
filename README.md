# Dogs Calendar React Native

Proyecto Expo con React Native, TypeScript y NativeWind.

## 🚀 Tecnologías

- **Expo SDK ~54**: Framework para desarrollo de aplicaciones móviles
- **React 19.1.0**: Biblioteca de interfaz de usuario
- **React Native 0.81.5**: Framework para aplicaciones móviles nativas
- **TypeScript ~5.9.2**: Superset tipado de JavaScript
- **NativeWind v4**: Tailwind CSS para React Native
- **React Native Reanimated**: Animaciones fluidas

## 📦 Instalación

```bash
npm install
```

## 🏃 Ejecución

### Desarrollo

```bash
npm start
```

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

### Web

```bash
npm run web
```

## 🎨 NativeWind

Este proyecto usa NativeWind v4 para estilización con Tailwind CSS. Puedes usar clases de Tailwind directamente en tus componentes:

```tsx
<View className="flex-1 bg-white items-center justify-center">
  <Text className="text-2xl font-bold text-blue-600">¡Hola Mundo!</Text>
</View>
```

## 📝 Estructura del Proyecto

```
.
├── App.tsx                 # Componente principal
├── assets/                 # Recursos (imágenes, fuentes, etc.)
├── babel.config.js         # Configuración de Babel
├── tailwind.config.js      # Configuración de Tailwind CSS
├── global.css              # Estilos globales de Tailwind
├── nativewind-env.d.ts     # Tipos de TypeScript para NativeWind
└── tsconfig.json           # Configuración de TypeScript
```

## 📚 Recursos

- [Documentación de Expo](https://docs.expo.dev/)
- [Documentación de NativeWind](https://www.nativewind.dev/)
- [Documentación de React Native](https://reactnative.dev/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/)
