import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import ProfileOverlay from "./ProfileOverlay";
import type { Profile } from "./ProfileCard";

const testI18n = i18n.createInstance();
testI18n.init({
  lng: "es",
  resources: { es: { common: {}, discover: {} } },
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
  scenario_label: "Café",
} as unknown as Profile;

describe("ProfileOverlay (breakdown slide)", () => {
  it("renders the 7 canonical dimensions from affinity_breakdown", () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <ProfileOverlay profile={profile} activePhotoIndex={1} />
      </I18nextProvider>,
    );
    expect(screen.getByTestId("care-bar-values")).toHaveAttribute(
      "data-value",
      "80",
    );
    expect(screen.getByText("Metas de relación")).toBeInTheDocument();
    expect(screen.getByText("Lenguaje del amor")).toBeInTheDocument();
  });

  it("does not render legacy breakdown labels", () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <ProfileOverlay profile={profile} activePhotoIndex={1} />
      </I18nextProvider>,
    );
    expect(
      screen.queryByText(/Sintonía de intenciones/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Estilo de vida/i)).not.toBeInTheDocument();
  });
});
