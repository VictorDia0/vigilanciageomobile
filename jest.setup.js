// Garante que módulos como src/services/api.ts (que lêem
// EXPO_PUBLIC_API_URL no carregamento do módulo e falham se ausente)
// possam ser importados em teste sem precisar de um .env real.
process.env.EXPO_PUBLIC_API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://test.local/api";
