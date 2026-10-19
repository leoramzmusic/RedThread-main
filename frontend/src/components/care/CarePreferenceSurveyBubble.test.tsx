import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CarePreferenceSurveyBubble from "./CarePreferenceSurveyBubble";
import { CARE_DIMENSIONS } from "../../constants/careDimensions";
import {
  createPreference,
  listPreferences,
  type CarePreference,
} from "../../services/carePreferencesService";

let mockQuery: Record<string, string> = {};

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: mockQuery,
    isReady: true,
    push: jest.fn(),
    pathname: "/home",
  }),
}));

jest.mock("../../services/carePreferencesService", () => {
  const actual = jest.requireActual("../../services/carePreferencesService");
  return {
    ...actual,
    listPreferences: jest.fn(),
    createPreference: jest.fn(),
    updatePreference: jest.fn(),
    deletePreference: jest.fn(),
  };
});

const mockList = listPreferences as jest.Mock;
const mockCreate = createPreference as jest.Mock;

const savedFor = (
  dimension: CarePreference["dimension"],
  score: number,
  id: string,
): CarePreference => ({
  id,
  user_id: "u1",
  dimension,
  tag: null,
  score,
  created_at: "2026-10-19T00:00:00",
  updated_at: "2026-10-19T00:00:00",
});

const valuesSaved = savedFor("values", 80, "p1");
const allSaved = CARE_DIMENSIONS.map((dimension, index) =>
  savedFor(dimension.key, 70, `p${index}`),
);

const commitSlider = (key: string, value: number) => {
  const slider = screen.getByTestId(`preference-slider-${key}`);
  const input = slider.querySelector('input[type="range"]')!;
  fireEvent.change(input, { target: { value: String(value) } });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = {};
  mockList.mockResolvedValue([valuesSaved]);
  mockCreate.mockImplementation(async (payload: Record<string, unknown>) => ({
    ...valuesSaved,
    id: "p2",
    ...payload,
  }));
});

describe("CarePreferenceSurveyBubble", () => {
  it("shows the notice while questions remain and opens the survey on click", async () => {
    render(<CarePreferenceSurveyBubble />);
    const notice = await screen.findByTestId("survey-bubble");
    expect(notice).toHaveTextContent("Tienes una encuesta disponible");
    fireEvent.click(notice);
    expect(screen.getByText("Preferencias CARE")).toBeInTheDocument();
    expect(
      await screen.findByTestId("preference-slider-relationship_goals"),
    ).toBeInTheDocument();
  });

  it("closes the survey but keeps the notice when questions remain", async () => {
    render(<CarePreferenceSurveyBubble />);
    fireEvent.click(await screen.findByTestId("survey-bubble"));
    fireEvent.click(screen.getByTestId("survey-bubble-close"));
    expect(screen.queryByTestId("survey-bubble-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("survey-bubble")).toBeInTheDocument();
  });

  it("opens automatically when the notification links to ?encuesta=1", async () => {
    mockQuery = { encuesta: "1" };
    render(<CarePreferenceSurveyBubble />);
    expect(
      await screen.findByTestId("survey-bubble-panel"),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId("preference-slider-relationship_goals"),
    ).toBeInTheDocument();
  });

  it("renders nothing when every question is answered", async () => {
    mockList.mockResolvedValue(allSaved);
    render(<CarePreferenceSurveyBubble />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByTestId("survey-bubble")).not.toBeInTheDocument(),
    );
  });

  it("disappears after completing the last pending question", async () => {
    mockList.mockResolvedValue(allSaved.slice(0, 6));
    render(<CarePreferenceSurveyBubble />);
    fireEvent.click(await screen.findByTestId("survey-bubble"));
    await screen.findByTestId("preference-slider-communication_style");
    commitSlider("communication_style", 8);
    await waitFor(() =>
      expect(
        screen.getByTestId("preference-status-communication_style"),
      ).toHaveTextContent("Guardado"),
    );
    fireEvent.click(screen.getByTestId("survey-next"));
    expect(await screen.findByTestId("survey-end-complete")).toHaveTextContent(
      "Encuesta completa",
    );
    fireEvent.click(screen.getByTestId("survey-bubble-close"));
    expect(screen.queryByTestId("survey-bubble")).not.toBeInTheDocument();
  });

  it("announces pending changes so the portal badge stays in sync", async () => {
    const listener = jest.fn();
    window.addEventListener("care-preferences-changed", listener);
    mockList.mockResolvedValue(allSaved.slice(0, 6));
    render(<CarePreferenceSurveyBubble />);
    fireEvent.click(await screen.findByTestId("survey-bubble"));
    await screen.findByTestId("preference-slider-communication_style");
    commitSlider("communication_style", 8);
    await waitFor(() => {
      const last = listener.mock.calls[listener.mock.calls.length - 1]?.[0] as
        CustomEvent | undefined;
      expect(last?.detail).toBe(0);
    });
    window.removeEventListener("care-preferences-changed", listener);
  });

  it("renders nothing when the preferences cannot be loaded", async () => {
    mockList.mockRejectedValue(new Error("network"));
    render(<CarePreferenceSurveyBubble />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByTestId("survey-bubble")).not.toBeInTheDocument(),
    );
  });
});
