import { render, screen } from "@testing-library/react";
import CarePreferenceInsights from "./CarePreferenceInsights";
import type { PreferenceInsights } from "../../services/carePreferencesAdminService";

const insights: PreferenceInsights = {
  generated_at: "2026-10-19T00:00:00",
  total_records: 3,
  unique_users: 2,
  dimensions: [
    { dimension: "values", count: 2, avg_score: 85.5 },
    { dimension: "music", count: 1, avg_score: 40 },
  ],
  tags: [{ tag: "appearance", count: 2, avg_score: 80 }],
  top_dimensions: [
    { dimension: "values", count: 2, avg_score: 85.5 },
    { dimension: "music", count: 1, avg_score: 40 },
  ],
};

describe("CarePreferenceInsights", () => {
  it("renders the top dimensions with average and count", () => {
    render(<CarePreferenceInsights insights={insights} />);
    expect(screen.getByTestId("preferences-top-values")).toHaveTextContent(
      "Valores",
    );
    expect(screen.getByTestId("preferences-top-values")).toHaveTextContent(
      "85.5 · 2 registros",
    );
    expect(screen.getByTestId("preferences-top-music")).toHaveTextContent(
      "Música",
    );
  });

  it("renders the dimension and tag distributions", () => {
    render(<CarePreferenceInsights insights={insights} />);
    expect(
      screen.getByTestId("preferences-dimension-values"),
    ).toHaveTextContent("2");
    expect(screen.getByTestId("preferences-tag-appearance")).toHaveTextContent(
      "appearance",
    );
  });

  it("shows empty states", () => {
    render(
      <CarePreferenceInsights
        insights={{
          ...insights,
          dimensions: [],
          tags: [],
          top_dimensions: [],
        }}
      />,
    );
    expect(screen.getByTestId("preferences-top-empty")).toHaveTextContent(
      "Aún no hay preferencias registradas.",
    );
    expect(screen.getByTestId("preferences-tags-empty")).toHaveTextContent(
      "Sin tags registrados.",
    );
  });
});
