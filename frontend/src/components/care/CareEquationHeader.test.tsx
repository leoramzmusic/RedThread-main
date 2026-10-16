import { render, screen } from "@testing-library/react";
import CareEquationHeader from "./CareEquationHeader";
import {
  CARE_DIMENSIONS,
  CANONICAL_BLOCK_WEIGHTS,
} from "../../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

describe("CareEquationHeader", () => {
  it("renders the stylized canonical formula", () => {
    render(<CareEquationHeader blocks={canonical} />);
    expect(screen.getByTestId("equation-formula")).toHaveTextContent(
      "CARE_score = Σ wᵢ·fᵢ + χ(t)",
    );
  });

  it("renders one synced chip per dimension with its percentage", () => {
    render(<CareEquationHeader blocks={canonical} />);
    CARE_DIMENSIONS.forEach((dim) => {
      expect(screen.getByTestId(`header-chip-${dim.key}`)).toHaveTextContent(
        dim.chip,
      );
    });
    expect(screen.getByTestId("header-chip-values")).toHaveTextContent("36%");
    expect(
      screen.getByTestId("header-chip-communication_style"),
    ).toHaveTextContent("4%");
  });

  it("emphasizes the focused chip only", () => {
    render(<CareEquationHeader blocks={canonical} focus="music" />);
    expect(screen.getByTestId("header-chip-music")).toHaveAttribute(
      "data-focus",
      "true",
    );
    expect(screen.getByTestId("header-chip-values")).toHaveAttribute(
      "data-focus",
      "false",
    );
  });

  it("renders the read-only pre-filter chips", () => {
    render(<CareEquationHeader blocks={canonical} />);
    expect(screen.getByTestId("prefilter-attraction")).toHaveTextContent(
      "Atracción mutua",
    );
    expect(screen.getByTestId("prefilter-identity")).toHaveTextContent(
      "Identidad",
    );
    expect(screen.getByText(/ANTES de la ecuación/i)).toBeInTheDocument();
  });
});
