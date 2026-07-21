import { dedupeRefresh, __resetRefreshStateForTests } from "./refreshQueue";

describe("dedupeRefresh", () => {
  beforeEach(() => {
    __resetRefreshStateForTests();
  });

  it("calls refreshFn once for a single call", async () => {
    const refreshFn = jest.fn().mockResolvedValue(undefined);
    await dedupeRefresh(refreshFn);
    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it("calls refreshFn only once for concurrent calls", async () => {
    let resolveRefresh: () => void;
    const refreshFn = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        })
    );

    const p1 = dedupeRefresh(refreshFn);
    const p2 = dedupeRefresh(refreshFn);
    const p3 = dedupeRefresh(refreshFn);

    resolveRefresh!();
    await Promise.all([p1, p2, p3]);

    expect(refreshFn).toHaveBeenCalledTimes(1);
  });

  it("allows a new refresh after the previous one finishes", async () => {
    const refreshFn = jest.fn().mockResolvedValue(undefined);

    await dedupeRefresh(refreshFn);
    await dedupeRefresh(refreshFn);

    expect(refreshFn).toHaveBeenCalledTimes(2);
  });

  it("clears the in-flight promise even when refreshFn rejects", async () => {
    const refreshFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("refresh failed"))
      .mockResolvedValueOnce(undefined);

    await expect(dedupeRefresh(refreshFn)).rejects.toThrow("refresh failed");
    await dedupeRefresh(refreshFn);

    expect(refreshFn).toHaveBeenCalledTimes(2);
  });
});
