import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CareNarrativeTrio from "./CareNarrativeTrio";
import type { EvaluationResult } from "../../services/careFormulaService";

const evaluation: EvaluationResult = {
  score: 0.6,
  base: 0.58,
  chi: 0.02,
  breakdown: {
    values: 0.5,
    relationship_goals: 0.5,
    neurodiversity: 0.5,
    responsiveness: 0.5,
    music: 0.5,
    love_language: 0.5,
    communication_style: 0.5,
    chaos_applied: 0.02,
    saturated: false,
    compatibility_label: "Medio",
    final_score: 0.6,
  },
};

const narrative = { tone: "poetico", text: "Sus almas...", label: "Medio" };

describe("CareNarrativeTrio", () => {
  it("renders χ, base, final and the band label", () => {
    render(
      <CareNarrativeTrio
        evaluation={evaluation}
        compatibilityLabel="Medio"
        narrative={narrative}
      />,
    );
    expect(screen.getByTestId("trio-chi")).toHaveTextContent("+0.020");
    expect(screen.getByTestId("trio-base")).toHaveTextContent("0.580");
    expect(screen.getByTestId("trio-final")).toHaveTextContent("0.600");
    expect(screen.getByTestId("trio-label")).toHaveTextContent("Medio");
  });

  it("renders the backend narrative and tone", () => {
    render(
      <CareNarrativeTrio
        evaluation={evaluation}
        compatibilityLabel="Medio"
        narrative={narrative}
      />,
    );
    expect(screen.getByTestId("narrative-text")).toHaveTextContent(
      "Sus almas...",
    );
    expect(screen.getByTestId("narrative-label")).toHaveTextContent("Medio");
    expect(screen.getByTestId("narrative-tone")).toHaveTextContent("poetico");
  });

  it("shows the saturated badge only when saturated", () => {
    const { rerender } = render(
      <CareNarrativeTrio
        evaluation={evaluation}
        compatibilityLabel="Medio"
        narrative={narrative}
      />,
    );
    expect(screen.queryByTestId("trio-saturated")).not.toBeInTheDocument();
    rerender(
      <CareNarrativeTrio
        evaluation={{
          ...evaluation,
          breakdown: { ...evaluation.breakdown, saturated: true },
        }}
        compatibilityLabel="Medio"
        narrative={narrative}
      />,
    );
    expect(screen.getByTestId("trio-saturated")).toBeInTheDocument();
  });

  it("uses the differentiated card background per mode", () => {
    const { unmount } = render(
      <CareNarrativeTrio
        evaluation={evaluation}
        compatibilityLabel="Medio"
        narrative={narrative}
      />,
    );
    expect(screen.getByTestId("narrative-card")).toHaveStyle({
      backgroundColor: "rgb(255, 255, 255)",
    });
    unmount();
    render(
      <ThemeProvider theme={createTheme({ palette: { mode: "dark" } })}>
        <CareNarrativeTrio
          evaluation={evaluation}
          compatibilityLabel="Medio"
          narrative={narrative}
        />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("narrative-card")).toHaveStyle({
      backgroundColor: "rgb(42, 42, 42)",
    });
  });
});
