export function resolveBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    // Fallback em vez de throw — evita crashar o app inteiro se a env var não chegar
    console.warn("EXPO_PUBLIC_API_URL não definida, usando fallback de produção");
    return "https://vigilancia-api.onrender.com/api";
  }
  return url;
}