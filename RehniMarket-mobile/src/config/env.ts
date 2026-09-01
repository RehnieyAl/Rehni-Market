const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl && __DEV__) {
  console.warn(
    "[config] EXPO_PUBLIC_API_URL no está definida en .env - las llamadas a la API van a fallar.",
  );
}

export const env = {
  apiUrl: apiUrl ?? "",
  whatsappNumber: process.env.EXPO_PUBLIC_REHNIMARKET_WHATSAPP ?? "",
};
