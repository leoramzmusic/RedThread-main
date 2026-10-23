import { glassCard, stateLayer } from "../glass";

describe("glassCard", () => {
  it("uses the RETH card geometry and glass recipe", () => {
    const style = glassCard(false) as Record<string, unknown>;
    expect(style.borderRadius).toBe(28);
    expect(style.backdropFilter).toBe("blur(20px) saturate(160%)");
    expect(style.WebkitBackdropFilter).toBe("blur(20px) saturate(160%)");
    expect(style.bgcolor).toBe("rgba(255,255,255,0.62)");
    expect(style.border).toBe("1px solid");
    expect(style.borderColor).toBe("rgba(255,255,255,0.55)");
    expect(style.boxShadow).toContain("inset 0 1px 0");
  });

  it("uses the canonical dark glass surface", () => {
    const style = glassCard(true) as Record<string, unknown>;
    expect(style.bgcolor).toBe("rgba(26,27,30,0.55)");
    expect(style.borderColor).toBe("rgba(255,255,255,0.14)");
  });

  it("falls back to an opaque surface when glass is unavailable", () => {
    const style = glassCard(true, { fallback: true }) as Record<
      string,
      unknown
    >;
    expect(style.backdropFilter).toBeUndefined();
    expect(style.WebkitBackdropFilter).toBeUndefined();
    expect(style.bgcolor).toBe("rgba(26,27,30,0.92)");
  });

  it("lifts and morphs only when interactive", () => {
    const style = glassCard(false, { interactive: true }) as Record<
      string,
      any
    >;
    expect(style["&:hover"].transform).toBe("translateY(-6px)");
    expect(style["&:hover"].borderRadius).toBe(24);
  });

  it("does not lift a static surface", () => {
    const style = glassCard(false) as Record<string, any>;
    expect(style["&:hover"]).toBeUndefined();
  });
});

describe("stateLayer", () => {
  it("uses the approved hover/focus/pressed opacities", () => {
    expect(stateLayer(false, "hover")).toBe("rgba(26,27,30,0.08)");
    expect(stateLayer(false, "focus")).toBe("rgba(26,27,30,0.12)");
    expect(stateLayer(false, "pressed")).toBe("rgba(26,27,30,0.12)");
  });

  it("uses a light layer on dark surfaces", () => {
    expect(stateLayer(true, "hover")).toBe("rgba(255,255,255,0.08)");
    expect(stateLayer(true, "focus")).toBe("rgba(255,255,255,0.12)");
  });
});
