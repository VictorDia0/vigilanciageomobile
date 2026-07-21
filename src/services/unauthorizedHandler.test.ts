import type { AxiosError, AxiosRequestConfig } from "axios";
import { handleUnauthorized } from "./unauthorizedHandler";

function makeError(status: number, url: string): AxiosError {
  return {
    isAxiosError: true,
    config: { url } as AxiosRequestConfig,
    response: { status } as any,
    toJSON: () => ({}),
    name: "AxiosError",
    message: "Request failed",
  } as AxiosError;
}

describe("handleUnauthorized", () => {
  it("retries the original request after a successful refresh", async () => {
    const refresh = jest.fn().mockResolvedValue(undefined);
    const retry = jest.fn().mockResolvedValue({ data: "ok" });
    const logout = jest.fn().mockResolvedValue(undefined);

    const result = await handleUnauthorized(makeError(401, "/visitas"), {
      refresh,
      retry,
      logout,
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(retry).toHaveBeenCalledWith({ url: "/visitas" });
    expect(logout).not.toHaveBeenCalled();
    expect(result).toEqual({ data: "ok" });
  });

  it("logs out when the refresh itself fails", async () => {
    const refresh = jest.fn().mockRejectedValue(new Error("refresh failed"));
    const retry = jest.fn();
    const logout = jest.fn().mockResolvedValue(undefined);

    await expect(
      handleUnauthorized(makeError(401, "/visitas"), { refresh, retry, logout })
    ).rejects.toBeDefined();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(retry).not.toHaveBeenCalled();
  });

  it.each(["/auth/login", "/auth/refresh", "/auth/logout"])(
    "does not attempt refresh for %s",
    async (url) => {
      const refresh = jest.fn();
      const retry = jest.fn();
      const logout = jest.fn();

      await expect(
        handleUnauthorized(makeError(401, url), { refresh, retry, logout })
      ).rejects.toBeDefined();

      expect(refresh).not.toHaveBeenCalled();
      expect(logout).not.toHaveBeenCalled();
    }
  );

  it("passes through non-401 errors unchanged", async () => {
    const refresh = jest.fn();
    const retry = jest.fn();
    const logout = jest.fn();

    await expect(
      handleUnauthorized(makeError(500, "/visitas"), { refresh, retry, logout })
    ).rejects.toBeDefined();

    expect(refresh).not.toHaveBeenCalled();
  });
});
