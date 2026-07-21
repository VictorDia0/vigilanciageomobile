export function resolveBaseUrl(
  env: Record<string, string | undefined>
): string {
  const url = env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_API_URL não está definida. Crie um arquivo .env na raiz do projeto (veja .env.example)."
    );
  }
  return url;
}
