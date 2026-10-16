import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CareCriteriaPage from "./criteria";
import {
  getActiveFormula,
  normalizeFormulaBlocks,
  saveFormula,
} from "../../../services/careFormulaService";
import { CANONICAL_BLOCK_WEIGHTS } from "../../../constants/careDimensions";

const mockPush = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock("../../../components/layout/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../components/care/CareCriteriaTable", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: {
      onSliderChange: (k: string, p: number) => void;
      onSliderCommit: (k: string, p: number) => void;
      onToggleLock: (k: string) => void;
      onProbar: (k: string) => void;
    }) =>
      React.createElement(
        "div",
        { "data-testid": "criteria-table" },
        React.createElement("button", {
          "data-testid": "stub-slide-values",
          onClick: () => props.onSliderChange("values", 40),
        }),
        React.createElement("button", {
          "data-testid": "stub-commit-values",
          onClick: () => props.onSliderCommit("values", 40),
        }),
        React.createElement("button", {
          "data-testid": "stub-lock-values",
          onClick: () => props.onToggleLock("values"),
        }),
        React.createElement("button", {
          "data-testid": "stub-probar-values",
          onClick: () => props.onProbar("values"),
        }),
      ),
  };
});

jest.mock("../../../services/careFormulaService", () => ({
  __esModule: true,
  getActiveFormula: jest.fn(),
  normalizeFormulaBlocks: jest.fn(),
  saveFormula: jest.fn(),
}));

const mockGetActive = getActiveFormula as jest.Mock;
const mockNormalize = normalizeFormulaBlocks as jest.Mock;
const mockSave = saveFormula as jest.Mock;

const active = {
  version: 3,
  status: "active",
  blocks: { ...CANONICAL_BLOCK_WEIGHTS },
  chaos_factor: 5,
  chaos_seed: null,
  min_compatibility: 0,
  match_critical: 0.15,
  changelog: "seed",
  created_by: "maria",
  created_at: "2026-10-16T12:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetActive.mockResolvedValue(active);
  mockNormalize.mockImplementation(async (blocks: Record<string, number>) => ({
    blocks,
  }));
  mockSave.mockResolvedValue({ ...active, version: 4 });
});

describe("CareCriteriaPage", () => {
  it("shows a loading indicator before the active formula resolves", () => {
    mockGetActive.mockReturnValue(new Promise(() => {}));
    render(<CareCriteriaPage />);
    expect(screen.getByTestId("criteria-loading")).toBeInTheDocument();
  });

  it("loads the active formula exactly once and renders the three KPIs", async () => {
    render(<CareCriteriaPage />);
    expect(await screen.findByTestId("kpi-total")).toHaveTextContent("100%");
    expect(screen.getByTestId("kpi-total-badge")).toHaveTextContent("Válido");
    expect(screen.getByTestId("kpi-version")).toHaveTextContent(
      "v3 · 2026-10-16 · maria",
    );
    expect(screen.getByTestId("kpi-chaos")).toHaveTextContent(
      "±5% · seed aleatoria",
    );
    expect(mockGetActive).toHaveBeenCalledTimes(1);
  });

  it("does not render the legacy 'Identidades Detectadas' KPI", async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    expect(
      screen.queryByText(/Identidades Detectadas/),
    ).not.toBeInTheDocument();
  });

  it("renders an error state when the active formula fails to load", async () => {
    mockGetActive.mockRejectedValueOnce(new Error("boom"));
    render(<CareCriteriaPage />);
    expect(await screen.findByTestId("criteria-error")).toHaveTextContent(
      "No se pudo cargar la fórmula activa.",
    );
  });

  it("normalizes on slider commit with the current blocks and locks", async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    fireEvent.click(screen.getByTestId("stub-lock-values"));
    fireEvent.click(screen.getByTestId("stub-commit-values"));
    await waitFor(() => expect(mockNormalize).toHaveBeenCalledTimes(1));
    expect(mockNormalize).toHaveBeenCalledWith(
      expect.objectContaining({ values: 0.4 }),
      ["values"],
    );
  });

  it("normalizes via the Normalizar button", async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    fireEvent.click(screen.getByRole("button", { name: /Normalizar/i }));
    await waitFor(() => expect(mockNormalize).toHaveBeenCalledTimes(1));
    expect(mockNormalize).toHaveBeenCalledWith(
      expect.objectContaining({ values: 0.36 }),
      [],
    );
  });

  it("navigates to equation on Probar, passing the draft and focus row", async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    fireEvent.click(screen.getByTestId("stub-probar-values"));
    expect(mockPush).toHaveBeenCalledTimes(1);
    const arg = mockPush.mock.calls[0][0];
    expect(arg.pathname).toBe("/portal-redthread/care/equation");
    expect(arg.query.source).toBe("criteria");
    expect(arg.query.focus).toBe("values");
    expect(JSON.parse(arg.query.w)).toEqual(active.blocks);
  });
});

describe("CareCriteriaPage / Aplicar Cambios", () => {
  const openModal = async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    fireEvent.click(screen.getByTestId("open-save-modal"));
    return screen.findByTestId("save-modal");
  };

  const typeChangelog = (text: string) => {
    const textarea = screen
      .getByTestId("changelog-input")
      .querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: text } });
  };

  it("disables Aplicar Cambios when the sum is not 100%", async () => {
    render(<CareCriteriaPage />);
    await screen.findByTestId("kpi-total");
    fireEvent.click(screen.getByTestId("stub-slide-values"));
    expect(screen.getByTestId("open-save-modal")).toBeDisabled();
  });

  it("shows the sum and 'sin cambios' when nothing changed", async () => {
    await openModal();
    expect(screen.getByTestId("modal-sum")).toHaveTextContent("100%");
    expect(screen.getByText(/Sin cambios respecto a v3/i)).toBeInTheDocument();
  });

  it("requires a non-empty changelog before enabling Guardar", async () => {
    await openModal();
    expect(screen.getByTestId("modal-save")).toBeDisabled();
    typeChangelog("ajuste de pesos");
    expect(screen.getByTestId("modal-save")).not.toBeDisabled();
  });

  it("normalizes then saves with source 'criteria' and the typed changelog", async () => {
    await openModal();
    typeChangelog("ajuste de pesos");
    fireEvent.click(screen.getByTestId("modal-save"));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockNormalize).toHaveBeenCalled();
    const [payload, source] = mockSave.mock.calls[0];
    expect(source).toBe("criteria");
    expect(payload.changelog).toBe("ajuste de pesos");
    expect(payload.blocks).toEqual(active.blocks);
    expect(payload.chaos_factor).toBe(5);
    expect(payload.match_critical).toBe(0.15);
    expect(await screen.findByTestId("criteria-success")).toHaveTextContent(
      "v4",
    );
  });

  it("surfaces a 409 (no change vs active) message and keeps the modal open", async () => {
    mockSave.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { detail: "La fórmula no cambió respecto a la versión activa" },
      },
    });
    await openModal();
    typeChangelog("sin cambios");
    fireEvent.click(screen.getByTestId("modal-save"));
    expect(await screen.findByTestId("save-error")).toHaveTextContent(
      "La fórmula no cambió respecto a la versión activa",
    );
    expect(screen.getByTestId("save-modal")).toBeInTheDocument();
  });

  it("surfaces a 422 validation error (array detail)", async () => {
    mockSave.mockRejectedValueOnce({
      response: {
        status: 422,
        data: { detail: ["La suma de pesos debe ser exactamente 1.0"] },
      },
    });
    await openModal();
    typeChangelog("roto");
    fireEvent.click(screen.getByTestId("modal-save"));
    expect(await screen.findByTestId("save-error")).toHaveTextContent(
      "La suma de pesos debe ser exactamente 1.0",
    );
  });
});
