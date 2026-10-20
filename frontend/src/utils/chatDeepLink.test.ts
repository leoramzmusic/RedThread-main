import { resolveDeepLinkedConversation } from "./chatDeepLink";

const convs = [{ conversation_id: "c1" }, { conversation_id: "c2" }];

describe("resolveDeepLinkedConversation", () => {
  it("returns the id when it exists", () => {
    expect(resolveDeepLinkedConversation("c2", convs)).toBe("c2");
  });

  it("handles array query values", () => {
    expect(resolveDeepLinkedConversation(["c1", "c9"], convs)).toBe("c1");
  });

  it("returns null when missing or unknown", () => {
    expect(resolveDeepLinkedConversation(undefined, convs)).toBeNull();
    expect(resolveDeepLinkedConversation("zz", convs)).toBeNull();
    expect(resolveDeepLinkedConversation("c1", [])).toBeNull();
  });
});
