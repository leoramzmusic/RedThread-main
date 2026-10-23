import { categoryForType } from "./notificationCategory";

describe("categoryForType", () => {
  it("maps likes and matches to social", () => {
    expect(categoryForType("like")).toBe("social");
    expect(categoryForType("match")).toBe("social");
  });

  it("maps messages to messages", () => {
    expect(categoryForType("message")).toBe("messages");
  });

  it("maps system, survey and promo to system", () => {
    expect(categoryForType("system")).toBe("system");
    expect(categoryForType("survey")).toBe("system");
    expect(categoryForType("promo")).toBe("system");
  });

  it("falls back unknown types to system", () => {
    expect(categoryForType("security")).toBe("system");
    expect(categoryForType("something-new")).toBe("system");
  });
});
