import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CareEquationPage from "./equation";
import {
  getActiveFormula,
  simulateFormula,
  validateFormula,
} from "../../../services/careFormulaService";
import { CANONICAL_BLOCK_WEIGHTS } from "../../../constants/careDimensions";

let mockQuery: Record<string, string> = {};
jest.mock("next/router", () => ({
  useRouter: () => ({ isReady: true, query: mockQuery, push: jest.fn() }),
}));

jest.mock("../../../components/layout/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../components/care/CareEquationHeader", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: {
      blocks: Record<string, number>;
      focus: string | null;
    }) =>
      React.createElement("div", {
        "data-testid": "header-stub",
        "data-blocks": JSON.stringify(props.blocks),
        "data-focus": props.focus ?? "",
      }),
  };
});
jest.mock("../../../components/care/CareFormulaCanvas", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () => React.createElement("div", { "data-testid": "canvas-stub" }),
  };
});
jest.mock("../../../components/care/CareEquationBlocks", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: { onSliderChange: (k: string, p: number) => void }) =>
      React.createElement(
        "div",
        { "data-testid": "blocks-stub" },
        React.createElement("button", {
          "data-testid": "stub-block-values",
          onClick: () => props.onSliderChange("values", 40),
        }),
      ),
  };
});
jest.mock("../../../components/care/CareChaosPanel", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: {
      deltaIndicator: number | null;
      onChaosChange: (v: number) => void;
      onGenerateSeed: () => void;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "chaos-stub",
          "data-delta": String(props.deltaIndicator),
        },
        React.createElement("button", {
          "data-testid": "stub-chaos",
          onClick: () => props.onChaosChange(10),
        }),
        React.createElement("button", {
          "data-testid": "stub-generate-seed",
          onClick: () => props.onGenerateSeed(),
        }),
      ),
  };
});
jest.mock("../../../components/care/CareThresholdsPanel", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: () =>
      React.createElement("div", { "data-testid": "thresholds-stub" }),
  };
});
jest.mock("../../../components/care/CareFormulaJsonEditor", () => {
  const React = require("react");
  const validJson = JSON.stringify({
    blocks: {
      values: 0.4,
      relationship_goals: 0.18,
      neurodiversity: 0.15,
      responsiveness: 0.1,
      music: 0.07,
      love_language: 0.06,
      communication_style: 0.04,
    },
    chaos_factor: 0,
    chaos_seed: null,
    min_compatibility: 0,
    match_critical: 0.15,
  });
  return {
    __esModule: true,
    default: (props: {
      value: string;
      valid: boolean;
      onChange: (t: string) => void;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "json-stub",
          "data-valid": String(props.valid),
          "data-value": props.value,
        },
        React.createElement("button", {
          "data-testid": "stub-json-valid",
          onClick: () => props.onChange(validJson),
        }),
        React.createElement("button", {
          "data-testid": "stub-json-invalid",
          onClick: () => props.onChange("not-json"),
        }),
      ),
  };
});
jest.mock("../../../components/care/CareSimulationTable", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: { result: unknown | null }) =>
      React.createElement("div", {
        "data-testid": "sim-stub",
        "data-has-result": String(props.result !== null),
      }),
  };
});
jest.mock("../../../services/careFormulaService", () => ({
  __esModule: true,
  getActiveFormula: jest.fn(),
  validateFormula: jest.fn(),
  simulateFormula: jest.fn(),
}));

const mockGetActive = getActiveFormula as jest.Mock;
const mockValidate = validateFormula as jest.Mock;
const mockSimulate = simulateFormula as jest.Mock;

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

const mockResult = {
  mock: true,
  ranking: [
    {
      candidate_id: "c1",
      score_current: 0.5,
      score_proposed: 0.6,
      chi_current: 0,
      chi_proposed: 0.02,
      delta: 0.1,
    },
    {
      candidate_id: "c2",
      score_current: 0.4,
      score_proposed: 0.45,
      chi_current: 0,
      chi_proposed: 0.01,
      delta: 0.05,
    },
  ],
  mean_delta: 0.075,
};

const draftBlocks = {
  values: 0.4,
  relationship_goals: 0.18,
  neurodiversity: 0.15,
  responsiveness: 0.1,
  music: 0.07,
  love_language: 0.06,
  communication_style: 0.04,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = {};
  mockGetActive.mockResolvedValue(active);
  mockValidate.mockResolvedValue({ valid: true, errors: [] });
  mockSimulate.mockResolvedValue(mockResult);
});

const headerBlocks = (): Record<string, number> =>
  JSON.parse(
    screen.getByTestId("header-stub").getAttribute("data-blocks") as string,
  );

describe("CareEquationPage / load + draft", () => {
  it("shows a loading indicator before the active formula resolves", () => {
    mockGetActive.mockReturnValue(new Promise(() => {}));
    render(<CareEquationPage />);
    expect(screen.getByTestId("equation-loading")).toBeInTheDocument();
  });

  it("applies the criteria draft from the router query and emphasizes focus", async () => {
    mockQuery = {
      source: "criteria",
      focus: "music",
      w: JSON.stringify(draftBlocks),
    };
    render(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    expect(screen.getByTestId("header-stub")).toHaveAttribute(
      "data-focus",
      "music",
    );
    expect(headerBlocks()).toEqual(draftBlocks);
  });

  it("uses the active blocks when no draft is present", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    expect(headerBlocks()).toEqual(active.blocks);
    expect(screen.getByTestId("header-stub")).toHaveAttribute("data-focus", "");
  });

  it("renders an error when the active formula fails to load", async () => {
    mockGetActive.mockRejectedValueOnce(new Error("boom"));
    render(<CareEquationPage />);
    expect(await screen.findByTestId("equation-error")).toHaveTextContent(
      "No se pudo cargar la fórmula activa.",
    );
  });
});

describe("CareEquationPage / bidirectional JSON", () => {
  it("regenerates the JSON when a block slider changes", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("stub-block-values"));
    expect(
      screen.getByTestId("json-stub").getAttribute("data-value"),
    ).toContain('"values": 0.4');
  });

  it("regenerates the JSON when the chaos slider changes", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("chaos-stub");
    fireEvent.click(screen.getByTestId("stub-chaos"));
    expect(
      screen.getByTestId("json-stub").getAttribute("data-value"),
    ).toContain('"chaos_factor": 10');
  });

  it("applies valid JSON back to the draft", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("json-stub");
    fireEvent.click(screen.getByTestId("stub-json-valid"));
    expect(headerBlocks()).toEqual(draftBlocks);
    expect(screen.getByTestId("json-stub")).toHaveAttribute(
      "data-valid",
      "true",
    );
  });

  it("flags invalid JSON and keeps the last valid draft", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("json-stub");
    fireEvent.click(screen.getByTestId("stub-json-invalid"));
    expect(screen.getByTestId("json-stub")).toHaveAttribute(
      "data-valid",
      "false",
    );
    expect(headerBlocks()).toEqual(active.blocks);
  });
});

describe("CareEquationPage / Validar + Simular", () => {
  it("validates and surfaces backend errors", async () => {
    mockValidate.mockResolvedValueOnce({
      valid: false,
      errors: ["La suma de pesos debe ser exactamente 1.0"],
    });
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("action-validate"));
    await waitFor(() => expect(mockValidate).toHaveBeenCalledTimes(1));
    expect(mockValidate).toHaveBeenCalledWith(
      expect.objectContaining({ blocks: active.blocks, chaos_factor: 5 }),
    );
    expect(await screen.findByTestId("validate-errors")).toHaveTextContent(
      "La suma de pesos debe ser exactamente 1.0",
    );
    expect(mockSimulate).not.toHaveBeenCalled();
  });

  it("runs the mock smoke test when validation passes", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("action-validate"));
    await waitFor(() => expect(mockSimulate).toHaveBeenCalledTimes(1));
    expect(mockSimulate).toHaveBeenCalledWith({
      formula: expect.objectContaining({ blocks: active.blocks }),
    });
  });

  it("shows degenerate weight + ranking alerts", async () => {
    mockQuery = {
      w: JSON.stringify({
        values: 0.95,
        relationship_goals: 0.05,
        neurodiversity: 0,
        responsiveness: 0,
        music: 0,
        love_language: 0,
        communication_style: 0,
      }),
    };
    mockSimulate.mockResolvedValueOnce({
      mock: true,
      ranking: [
        {
          candidate_id: "c1",
          score_current: 0.5,
          score_proposed: 0.5,
          chi_current: 0,
          chi_proposed: 0,
          delta: 0,
        },
        {
          candidate_id: "c2",
          score_current: 0.5,
          score_proposed: 0.5,
          chi_current: 0,
          chi_proposed: 0,
          delta: 0,
        },
      ],
      mean_delta: 0,
    });
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("action-validate"));
    const alerts = await screen.findByTestId("validate-alerts");
    expect(alerts).toHaveTextContent("0%");
    expect(alerts).toHaveTextContent("idénticos");
  });

  it("short-circuits to client validation for an unbalanced sum", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("stub-block-values")); // values -> 40% => sum 104%
    fireEvent.click(screen.getByTestId("action-validate"));
    expect(await screen.findByTestId("validate-errors")).toHaveTextContent(
      "100%",
    );
    expect(mockValidate).not.toHaveBeenCalled();
  });

  it("simulates and feeds the result (with χ) to the table + chaos Δ", async () => {
    render(<CareEquationPage />);
    await screen.findByTestId("blocks-stub");
    fireEvent.click(screen.getByTestId("action-simulate"));
    await waitFor(() => expect(mockSimulate).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("sim-stub")).toHaveAttribute(
      "data-has-result",
      "true",
    );
    expect(screen.getByTestId("chaos-stub")).toHaveAttribute(
      "data-delta",
      "0.075",
    );
  });
});
