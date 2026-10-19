import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CarePreferenceCards from "./CarePreferenceCards";
import { CARE_DIMENSIONS } from "../../constants/careDimensions";
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
  mockList.mockResolvedValue([valuesSaved]);
  mockUpdate.mockImplementation(
    async (_id: string, payload: { score: number }) => ({
      ...valuesSaved,
      ...payload,
    }),
  );
  mockCreate.mockImplementation(async (payload: Record<string, unknown>) => ({
    ...valuesSaved,
    id: "p2",
    ...payload,
  }));
  mockDelete.mockResolvedValue(undefined);
});

describe("CarePreferenceCards", () => {
  it("starts at the first pending dimension, one question at a time", async () => {
    render(<CarePreferenceCards />);
    expect(
      await screen.findByTestId("preference-slider-relationship_goals"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("survey-progress")).toHaveTextContent(
      "Pregunta 2 de 7",
    );
    expect(
      screen.getByText("¿Qué tanto te importa que busque lo mismo que tú?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("preference-slider-values"),
    ).not.toBeInTheDocument();
  });

  it("commits the 0-10 answer as a 0-100 preference and unlocks Siguiente", async () => {
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-relationship_goals");
    expect(screen.getByTestId("survey-next")).toBeDisabled();
    commitSlider("relationship_goals", 9);
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        dimension: "relationship_goals",
        score: 90,
      });
      expect(
        screen.getByTestId("preference-status-relationship_goals"),
      ).toHaveTextContent("Guardado");
    });
    expect(screen.getByTestId("survey-next")).toBeEnabled();
  });

  it("walks back with Atrás and forward with Siguiente", async () => {
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-relationship_goals");
    fireEvent.click(screen.getByTestId("survey-prev"));
    expect(screen.getByTestId("survey-progress")).toHaveTextContent(
      "Pregunta 1 de 7",
    );
    expect(screen.getByTestId("preference-slider-values")).toBeInTheDocument();
    expect(screen.getByTestId("preference-status-values")).toHaveTextContent(
      "Guardado",
    );
    fireEvent.click(screen.getByTestId("survey-next"));
    expect(screen.getByTestId("survey-progress")).toHaveTextContent(
      "Pregunta 2 de 7",
    );
    expect(
      screen.getByTestId("preference-slider-relationship_goals"),
    ).toBeInTheDocument();
  });

  it("Saltar advances without saving and leaves the question pending", async () => {
    mockList.mockResolvedValue([]);
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-values");
    fireEvent.click(screen.getByTestId("survey-skip"));
    expect(screen.getByTestId("survey-progress")).toHaveTextContent(
      "Pregunta 2 de 7",
    );
    expect(
      screen.getByTestId("preference-slider-relationship_goals"),
    ).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("shows the pending count at the end and cycles the pending questions", async () => {
    mockList.mockResolvedValue([]);
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-values");
    for (let index = 0; index < CARE_DIMENSIONS.length; index++) {
      fireEvent.click(screen.getByTestId("survey-skip"));
    }
    expect(screen.getByTestId("survey-end")).toHaveTextContent(
      "Te quedan 7 preguntas sin responder",
    );
    fireEvent.click(screen.getByTestId("survey-end-pending"));
    expect(screen.getByTestId("survey-progress")).toHaveTextContent(
      "Pregunta 1 de 7",
    );
    expect(screen.getByTestId("preference-slider-values")).toBeInTheDocument();
  });

  it("shows the complete summary when every dimension is answered", async () => {
    mockList.mockResolvedValue(allSaved);
    render(<CarePreferenceCards />);
    expect(await screen.findByTestId("survey-end-complete")).toHaveTextContent(
      "Encuesta completa",
    );
    expect(screen.getByTestId("survey-summary-values")).toHaveTextContent(
      "Valores · 7/10",
    );
    fireEvent.click(screen.getByTestId("survey-restart"));
    expect(screen.getByTestId("survey-progress")).toHaveTextContent(
      "Pregunta 1 de 7",
    );
    expect(screen.getByTestId("preference-status-values")).toHaveTextContent(
      "Guardado",
    );
  });

  it("deletes a saved preference from its question", async () => {
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-relationship_goals");
    fireEvent.click(screen.getByTestId("survey-prev"));
    fireEvent.click(await screen.findByTestId("preference-delete-values"));
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("p1"));
    expect(screen.getByTestId("preference-status-values")).toHaveTextContent(
      "Sin guardar",
    );
  });

  it("shows the error and keeps the value when saving fails", async () => {
    mockCreate.mockRejectedValueOnce({ response: { status: 409 } });
    render(<CarePreferenceCards />);
    await screen.findByTestId("preference-slider-relationship_goals");
    commitSlider("relationship_goals", 7);
    expect(
      await screen.findByTestId("preference-error-relationship_goals"),
    ).toHaveTextContent("Ya existe una preferencia para esa dimensión.");
    expect(
      screen.getByTestId("preference-status-relationship_goals"),
    ).toHaveTextContent("Sin guardar");
    const input = screen
      .getByTestId("preference-slider-relationship_goals")
      .querySelector('input[type="range"]') as HTMLInputElement;
    expect(input.value).toBe("7");
    expect(screen.getByTestId("survey-next")).toBeDisabled();
  });
});
