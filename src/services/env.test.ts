import { resolveBaseUrl } from "./env";

describe("resolveBaseUrl", () => {
  it("returns the URL when EXPO_PUBLIC_API_URL is set", () => {
    expect(
      resolveBaseUrl({ EXPO_PUBLIC_API_URL: "https://api.example.com" })
    ).toBe("https://api.example.com");
  });

  it("throws when EXPO_PUBLIC_API_URL is missing", () => {
    expect(() => resolveBaseUrl({})).toThrow("EXPO_PUBLIC_API_URL");
  });

  it("throws when EXPO_PUBLIC_API_URL is an empty string", () => {
    expect(() => resolveBaseUrl({ EXPO_PUBLIC_API_URL: "" })).toThrow(
      "EXPO_PUBLIC_API_URL"
    );
  });
});
