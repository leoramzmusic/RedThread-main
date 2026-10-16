import { render, screen } from "@testing-library/react";
import CareFormulaCanvas from "./CareFormulaCanvas";
import { CANONICAL_BLOCK_WEIGHTS } from "../../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

describe("CareFormulaCanvas", () => {
  it("renders the central Ψ node", () => {
    render(<CareFormulaCanvas blocks={canonical} />);
    expect(screen.getByTestId("canvas-psi")).toBeInTheDocument();
    expect(screen.getByTestId("canvas-psi").parentElement).not.toBeNull();
    expect(screen.getByText("Ψ")).toBeInTheDocument();
  });

  it("renders 7 orbital nodes sized proportionally to weight", () => {
    render(<CareFormulaCanvas blocks={canonical} />);
    const values = screen.getByTestId("node-values");
    const comms = screen.getByTestId("node-communication_style");
    expect(Number(values.getAttribute("data-radius"))).toBeGreaterThan(
      Number(comms.getAttribute("data-radius")),
    );
  });

  it("labels each edge with its weight coefficient", () => {
    render(<CareFormulaCanvas blocks={canonical} />);
    expect(screen.getByTestId("edge-label-values")).toHaveTextContent("36%");
    expect(screen.getByTestId("edge-label-music")).toHaveTextContent("11%");
  });

  it("marks the focused node", () => {
    render(<CareFormulaCanvas blocks={canonical} focus="values" />);
    expect(screen.getByTestId("node-values")).toHaveAttribute(
      "data-focus",
      "true",
    );
    expect(screen.getByTestId("node-music")).toHaveAttribute(
      "data-focus",
      "false",
    );
  });
});
