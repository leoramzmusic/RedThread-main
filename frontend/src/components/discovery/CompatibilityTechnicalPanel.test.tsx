import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import CompatibilityTechnicalPanel from "./CompatibilityTechnicalPanel";
import type { Profile } from "../profile/ProfileCard";

jest.mock("../../context/ThemeContext", () => ({
  useAppTheme: () => ({ mode: "dark" }),
}));

const testI18n = i18n.createInstance();
testI18n.init({
  lng: "es",
  resources: { es: { discover: {}, common: {} } },
  interpolation: { escapeValue: false },
});

const profile = {
  user_id: "u1",
  display_name: "Ada",
  age: 30,
  photos: [],
  affinity_score: 72,
  affinity_breakdown: {
    values: 80,
    relationship_goals: 50,
    neurodiversity: 100,
    responsiveness: 10,
    music: 11,
    love_language: 6,
    communication_style: 4,
  },
} as unknown as Profile;

describe("CompatibilityTechnicalPanel", () => {
  it("renders the canonical dimensions and no hardcoded mock values", () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <CompatibilityTechnicalPanel
          profile={profile}
          isVisible
          onViewProfile={() => {}}
        />
      </I18nextProvider>,
    );
    expect(screen.getByTestId("care-bar-values")).toHaveAttribute(
      "data-value",
      "80",
    );
    expect(screen.getByText("Neurodiversidad")).toBeInTheDocument();
  });
});
