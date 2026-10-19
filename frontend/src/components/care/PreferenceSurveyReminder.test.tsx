import { render, screen, waitFor } from "@testing-library/react";
import PreferenceSurveyReminder from "./PreferenceSurveyReminder";
import { CARE_DIMENSIONS } from "../../constants/careDimensions";
import {
  listPreferences,
  type CarePreference,
} from "../../services/carePreferencesService";

jest.mock("../../services/carePreferencesService", () => {
  const actual = jest.requireActual("../../services/carePreferencesService");
  return {
    ...actual,
    listPreferences: jest.fn(),
  };
});

const mockList = listPreferences as jest.Mock;

const saved = (count: number): CarePreference[] =>
  CARE_DIMENSIONS.slice(0, count).map((dimension, index) => ({
    id: `p${index}`,
    user_id: "u1",
    dimension: dimension.key,
    tag: null,
    score: 70,
    created_at: "2026-10-19T00:00:00",
    updated_at: "2026-10-19T00:00:00",
  }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PreferenceSurveyReminder", () => {
  it("shows the pending survey with a continue link to Home", async () => {
    mockList.mockResolvedValue(saved(3));
    render(<PreferenceSurveyReminder />);
    expect(await screen.findByTestId("preferences-reminder")).toHaveTextContent(
      "Encuesta pendiente: te faltan 4 preguntas para completar tus preferencias.",
    );
    expect(screen.getByTestId("preferences-reminder-cta")).toHaveAttribute(
      "href",
      "/home?encuesta=1",
    );
    expect(
      screen.queryByTestId("preferences-reminder-dismiss"),
    ).not.toBeInTheDocument();
  });

  it("uses the singular form for one pending question", async () => {
    mockList.mockResolvedValue(saved(6));
    render(<PreferenceSurveyReminder />);
    expect(await screen.findByTestId("preferences-reminder")).toHaveTextContent(
      "Encuesta pendiente: te falta 1 pregunta para completar tus preferencias.",
    );
  });

  it("renders nothing when every dimension is answered", async () => {
    mockList.mockResolvedValue(saved(CARE_DIMENSIONS.length));
    render(<PreferenceSurveyReminder />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.queryByTestId("preferences-reminder"),
      ).not.toBeInTheDocument(),
    );
  });

  it("renders nothing when the preferences cannot be loaded", async () => {
    mockList.mockRejectedValue(new Error("network"));
    render(<PreferenceSurveyReminder />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(
        screen.queryByTestId("preferences-reminder"),
      ).not.toBeInTheDocument(),
    );
  });
});
