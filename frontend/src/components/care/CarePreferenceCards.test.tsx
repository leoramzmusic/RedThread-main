import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CarePreferenceCards from "./CarePreferenceCards";
import {
  createPreference,
  deletePreference,
  listPreferences,
  updatePreference,
  type CarePreference,
} from "../../services/carePreferencesService";

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
const mockUpdate = updatePreference as jest.Mock;
const mockDelete = deletePreference as jest.Mock;

const saved: CarePreference = {
  id: "p1",
  user_id: "u1",
  dimension: "values",
  tag: null,
  score: 80,
  created_at: "2026-10-19T00:00:00",
  updated_at: "2026-10-19T00:00:00",
};

const commitSlider = (key: string, value: number) => {
  const slider = screen.getByTestId(`preference-slider-${key}`);
  const input = slider.querySelector('input[type="range"]')!;
  fireEvent.change(input, { target: { value: String(value) } });
};

beforeEach(() => {
  jest.clearAllMocks();
  mockList.mockResolvedValue([saved]);
  mockUpdate.mockImplementation(
    async (_id: string, payload: { score: number }) => ({
      ...saved,
      ...payload,
    }),
  );
  mockCreate.mockImplementation(async (payload: Record<string, unknown>) => ({
    ...saved,
    id: "p2",
    ...payload,
  }));
  mockDelete.mockResolvedValue(undefined);
});

describe("CarePreferenceCards", () => {
  it("loads the user's preferences and marks saved dimensions", async () => {
    render(<CarePreferenceCards />);
    expect(
      await screen.findByTestId("preference-slider-values"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("preference-status-values")).toHaveTextContent(
      "Guardado",
    );
    expect(screen.getByTestId("preference-status-music")).toHaveTextContent(
      "Sin guardar",
    );
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it("updates an existing dimension when the slider is committed", async () => {
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-values");
    commitSlider("values", 90);
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith("p1", { score: 90 }),
    );
  });

  it("creates a new dimension on first commit", async () => {
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-music");
    commitSlider("music", 70);
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        dimension: "music",
        score: 70,
      }),
    );
  });

  it("deletes a saved preference", async () => {
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-delete-values");
    fireEvent.click(screen.getByTestId("preference-delete-values"));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("p1"));
    expect(screen.getByTestId("preference-status-values")).toHaveTextContent(
      "Sin guardar",
    );
  });

  it("keeps the local score and shows the error when saving fails", async () => {
    mockUpdate.mockRejectedValueOnce({ response: { status: 409 } });
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-values");
    commitSlider("values", 95);
    expect(
      await screen.findByTestId("preference-error-values"),
    ).toHaveTextContent("Ya existe una preferencia para esa dimensión.");
    expect(screen.getByTestId("preference-status-values")).toHaveTextContent(
      "Guardado",
    );
    const input = screen
      .getByTestId("preference-slider-values")
      .querySelector('input[type="range"]') as HTMLInputElement;
    expect(input.value).toBe("95");
  });
});
