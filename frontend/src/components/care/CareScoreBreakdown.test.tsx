import { render, screen } from "@testing-library/react";
import CareScoreBreakdown from "./CareScoreBreakdown";
import { computeContributions } from "../../utils/careInterpreterModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../../constants/careDimensions";
import type { FormulaBreakdown } from "../../services/careFormulaService";

const breakdown: FormulaBreakdown = {
  values: 0.5,
  relationship_goals: 0.5,
  neurodiversity: 0.5,
  responsiveness: 0.5,
  music: 0.5,
  love_language: 0.5,
  communication_style: 0.5,
  chaos_applied: 0,
  saturated: false,
  compatibility_label: "Medio",
  final_score: 0.5,
};

const rows = computeContributions({ ...CANONICAL_BLOCK_WEIGHTS }, breakdown);

describe("CareScoreBreakdown", () => {
  it("renders one row per dimension with fᵢ, wᵢ and the contribution", () => {
    render(<CareScoreBreakdown rows={rows} />);
    expect(screen.getByTestId("breakdown-fi-values")).toHaveTextContent(
      "0.500",
    );
    expect(screen.getByTestId("breakdown-wi-values")).toHaveTextContent(
      "0.360",
    );
    expect(
      screen.getByTestId("breakdown-contribution-values"),
    ).toHaveTextContent("0.180");
    expect(
      screen.getByTestId("breakdown-row-communication_style"),
    ).toBeInTheDocument();
  });

  it("scales each bar to the largest contribution", () => {
    render(<CareScoreBreakdown rows={rows} />);
    expect(screen.getByTestId("breakdown-bar-values")).toHaveAttribute(
      "data-value",
      "100",
    );
    expect(
      screen.getByTestId("breakdown-bar-communication_style"),
    ).toHaveAttribute("data-value", "11");
  });
});
