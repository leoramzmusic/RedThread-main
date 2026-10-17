import { render, screen, fireEvent } from "@testing-library/react";
import CareFormulaCanvas from "./CareFormulaCanvas";
import { CANONICAL_BLOCK_WEIGHTS } from "../../constants/careDimensions";
import { AppThemeProvider } from "../../context/ThemeContext";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<AppThemeProvider>{ui}</AppThemeProvider>);
};

const getCssText = () => {
  let text = "";
  document.querySelectorAll("style").forEach((s) => {
    text += s.textContent ?? "";
    const sheet = s.sheet as CSSStyleSheet | null;
    if (sheet) {
      try {
        Array.from(sheet.cssRules).forEach((r) => {
          text += `${r.cssText}\n`;
        });
      } catch {
        /* cross-origin or unsupported rule */
      }
    }
  });
  return text;
};

describe("CareFormulaCanvas", () => {
  it("renders the central Ψ node", () => {
    renderWithTheme(<CareFormulaCanvas blocks={canonical} />);
    expect(screen.getByTestId("canvas-psi")).toBeInTheDocument();
    expect(screen.getByTestId("canvas-psi").parentElement).not.toBeNull();
    expect(screen.getByText("Ψ")).toBeInTheDocument();
  });

  it("renders 7 orbital nodes sized proportionally to weight", () => {
    renderWithTheme(<CareFormulaCanvas blocks={canonical} />);
    const values = screen.getByTestId("node-values");
    const comms = screen.getByTestId("node-communication_style");
    expect(Number(values.getAttribute("data-radius"))).toBeGreaterThan(
      Number(comms.getAttribute("data-radius")),
    );
  });

  it("labels each edge with its weight coefficient", () => {
    renderWithTheme(<CareFormulaCanvas blocks={canonical} />);
    expect(screen.getByTestId("edge-label-values")).toHaveTextContent("36%");
    expect(screen.getByTestId("edge-label-music")).toHaveTextContent("11%");
  });

  it("marks the focused node", () => {
    renderWithTheme(<CareFormulaCanvas blocks={canonical} focus="values" />);
    expect(screen.getByTestId("node-values")).toHaveAttribute(
      "data-focus",
      "true",
    );
    expect(screen.getByTestId("node-music")).toHaveAttribute(
      "data-focus",
      "false",
    );
  });

  it("renders the explanatory formula caption", () => {
    renderWithTheme(<CareFormulaCanvas blocks={canonical} />);
    expect(screen.getByTestId("canvas-formula")).toHaveTextContent(
      "CARE_score = Σ wᵢ·fᵢ + χ(t)",
    );
  });

  it("emits onNodeHover on node enter/leave", () => {
    const onNodeHover = jest.fn();
    renderWithTheme(
      <CareFormulaCanvas blocks={canonical} onNodeHover={onNodeHover} />,
    );
    fireEvent.mouseEnter(screen.getByTestId("node-values"));
    expect(onNodeHover).toHaveBeenCalledWith("values");
    fireEvent.mouseLeave(screen.getByTestId("node-values"));
    expect(onNodeHover).toHaveBeenCalledWith(null);
  });

  it("pulses only the nodes with weight > 0", () => {
    renderWithTheme(<CareFormulaCanvas blocks={{ ...canonical, music: 0 }} />);
    expect(screen.getByTestId("node-values")).toHaveAttribute(
      "data-pulse",
      "true",
    );
    expect(screen.getByTestId("node-music")).toHaveAttribute(
      "data-pulse",
      "false",
    );
  });

  it("marks the transient glow node after a weight change", () => {
    renderWithTheme(<CareFormulaCanvas blocks={canonical} glow="values" />);
    expect(screen.getByTestId("node-values")).toHaveAttribute(
      "data-glow",
      "true",
    );
    expect(screen.getByTestId("node-music")).toHaveAttribute(
      "data-glow",
      "false",
    );
  });

  it("pulses Ψ when pulseToken changes", () => {
    const { rerender } = renderWithTheme(
      <CareFormulaCanvas blocks={canonical} pulseToken={0} />,
    );
    expect(screen.getByTestId("canvas-psi")).toHaveAttribute(
      "data-pulse-token",
      "0",
    );
    rerender(
      <AppThemeProvider>
        <CareFormulaCanvas blocks={canonical} pulseToken={1} />
      </AppThemeProvider>,
    );
    expect(screen.getByTestId("canvas-psi")).toHaveAttribute(
      "data-pulse-token",
      "1",
    );
  });

  it("gates the animations behind prefers-reduced-motion", () => {
    renderWithTheme(<CareFormulaCanvas blocks={canonical} />);
    const css = getCssText();
    expect(css).toContain("prefers-reduced-motion: no-preference");
    expect(css).toContain("rtDiaNodePulse");
    expect(css).toContain("rtDiaEdgeDraw");
    expect(css).toContain("rtDiaDashFlow");
    expect(css).toContain("rtDiaPsiBreath");
  });
});
