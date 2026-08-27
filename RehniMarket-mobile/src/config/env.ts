// Única fuente de configuración por entorno. Espejo de
// `import.meta.env.VITE_API_URL` en la web (ver RehniMarket-frontend/src/
// api/Client.ts), acá vía EXPO_PUBLIC_API_URL (.env / .env.example en la
// raíz del proyecto - Expo solo expone al bundle las variables con ese
// prefijo).
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl && __DEV__) {
  console.warn(
    "[config] EXPO_PUBLIC_API_URL no está definida en .env - las llamadas a la API van a fallar.",
  );
}

export const env = {
  apiUrl: apiUrl ?? "",
};
