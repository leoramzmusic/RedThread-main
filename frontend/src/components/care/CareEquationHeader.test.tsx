import { render, screen } from "@testing-library/react";
import CareEquationHeader from "./CareEquationHeader";
import {
  CARE_DIMENSIONS,
  CANONICAL_BLOCK_WEIGHTS,
} from "../../constants/careDimensions";
import { AppThemeProvider } from "../../context/ThemeContext";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<AppThemeProvider>{ui}</AppThemeProvider>);
};

describe("CareEquationHeader", () => {
  it("renders the stylized canonical formula", () => {
    renderWithTheme(<CareEquationHeader blocks={canonical} />);
    expect(screen.getByTestId("equation-formula")).toHaveTextContent(
      "CARE_score = Σ wᵢ·fᵢ + χ(t)",
    );
  });

  it("renders one synced chip per dimension with its percentage", () => {
    renderWithTheme(<CareEquationHeader blocks={canonical} />);
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
    renderWithTheme(<CareEquationHeader blocks={canonical} focus="music" />);
    expect(screen.getByTestId("header-chip-music")).toHaveAttribute(
      "data-focus",
      "true",
    );
    expect(screen.getByTestId("header-chip-values")).toHaveAttribute(
      "data-focus",
      "false",
    );
  });

  it("leaves the wᵢ·fᵢ term unhighlighted by default", () => {
    renderWithTheme(<CareEquationHeader blocks={canonical} />);
    expect(screen.getByTestId("formula-weights")).toHaveAttribute(
      "data-highlight",
      "",
    );
  });

  it("highlights the wᵢ·fᵢ term with the focused dimension", () => {
    renderWithTheme(<CareEquationHeader blocks={canonical} focus="music" />);
    expect(screen.getByTestId("formula-weights")).toHaveAttribute(
      "data-highlight",
      "music",
    );
  });

  it("lets the transient glow override focus in the term", () => {
    renderWithTheme(
      <CareEquationHeader blocks={canonical} focus="values" glow="music" />,
    );
    expect(screen.getByTestId("formula-weights")).toHaveAttribute(
      "data-highlight",
      "music",
    );
  });

  it("renders the read-only pre-filter chips", () => {
    renderWithTheme(<CareEquationHeader blocks={canonical} />);
    expect(screen.getByTestId("prefilter-attraction")).toHaveTextContent(
      "Atracción mutua",
    );
    expect(screen.getByTestId("prefilter-identity")).toHaveTextContent(
      "Identidad",
    );
    expect(screen.getByText(/ANTES de la ecuación/i)).toBeInTheDocument();
  });
});
