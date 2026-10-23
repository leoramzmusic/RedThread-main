import { densityForCount } from "./notificationDensity";

describe("densityForCount", () => {
  it("returns empty with no notifications", () => {
    expect(densityForCount(0)).toBe("empty");
  });

  it("returns sparse for one or two notifications", () => {
    expect(densityForCount(1)).toBe("sparse");
    expect(densityForCount(2)).toBe("sparse");
  });

  it("returns standard for three through twelve notifications", () => {
    expect(densityForCount(3)).toBe("standard");
    expect(densityForCount(12)).toBe("standard");
  });

  it("returns dense above twelve notifications", () => {
    expect(densityForCount(13)).toBe("dense");
    expect(densityForCount(50)).toBe("dense");
  });
});
