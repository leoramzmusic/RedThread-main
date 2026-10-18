import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import CareEquationPage from "./equation";
import {
  getActiveFormula,
  listFormulaVersions,
  normalizeFormulaBlocks,
  previewFormula,
  rollbackFormula,
  saveFormula,
  simulateFormula,
  validateFormula,
} from "../../../services/careFormulaService";
import {
  createProfile,
  deleteProfile,
  listProfiles,
  updateProfile,
} from "../../../services/careProfileService";
import { CANONICAL_BLOCK_WEIGHTS } from "../../../constants/careDimensions";
import { AppThemeProvider } from "../../../context/ThemeContext";

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<AppThemeProvider>{ui}</AppThemeProvider>);
};

let mockQuery: Record<string, string> = {};
jest.mock("next/router", () => ({
  useRouter: () => ({
    isReady: true,
    query: mockQuery,
    push: jest.fn(),
    pathname: "/portal-redthread/care/equation",
  }),
}));

jest.mock("../../../components/layout/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../components/common/UserSearchAutocomplete", () => {
  const React = require("react");
  const USERS: Record<
    string,
    {
      id: string;
      email: string | null;
      display_name: string;
      nickname: string;
      photo: string | null;
    }
  > = {
    a: {
      id: "u1",
      email: "ana@x.com",
      display_name: "Ana A",
      nickname: "ana",
      photo: null,
    },
    b: {
      id: "u2",
      email: "beto@x.com",
      display_name: "Beto B",
      nickname: "beto",
      photo: null,
    },
  };
  return {
    __esModule: true,
    default: (props: {
      label?: string;
      value: { id: string } | null;
      onChange: (user: (typeof USERS)["a"] | null) => void;
      excludeId?: string | null;
    }) => {
      const key = props.label === "Usuario A" ? "a" : "b";
      return React.createElement(
        "div",
        { "data-testid": `search-${key}` },
        React.createElement(
          "span",
          { "data-testid": `search-${key}-value` },
          props.value?.id ?? "",
        ),
        React.createElement(
          "span",
          { "data-testid": `search-${key}-exclude` },
          props.excludeId ?? "",
        ),
        React.createElement("button", {
          "data-testid": `search-${key}-pick`,
          onClick: () => props.onChange(USERS[key]),
        }),
        React.createElement("button", {
          "data-testid": `search-${key}-pick-a`,
          onClick: () => props.onChange(USERS.a),
        }),
        React.createElement("button", {
          "data-testid": `search-${key}-clear`,
          onClick: () => props.onChange(null),
        }),
      );
    },
  };
});

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
    default: (props: {
      onNodeHover?: (k: string) => void;
      glow?: string | null;
      pulseToken?: number;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "canvas-stub",
          "data-glow": props.glow ?? "",
          "data-pulse": String(props.pulseToken ?? 0),
        },
        React.createElement("button", {
          "data-testid": "stub-node-hover-values",
          onClick: () => props.onNodeHover?.("values"),
        }),
      ),
  };
});
jest.mock("../../../components/care/CareCriteriaTable", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: {
      locked: string[];
      focus?: string | null;
      onSliderChange: (k: string, p: number) => void;
      onSliderCommit: (k: string, p: number) => void;
      onToggleLock: (k: string) => void;
      onProbar: (k: string) => void;
      onBlockHover?: (k: string | null) => void;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "criteria-table",
          "data-locked": props.locked.join(","),
          "data-focus": props.focus ?? "",
        },
        React.createElement("button", {
          "data-testid": "stub-slide-values",
          onClick: () => props.onSliderChange("values", 40),
        }),
        React.createElement("button", {
          "data-testid": "stub-slide-values-30",
          onClick: () => props.onSliderChange("values", 30),
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
        React.createElement("button", {
          "data-testid": "stub-hover-values",
          onClick: () => props.onBlockHover?.("values"),
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
  const unbalancedJson = JSON.stringify({
    blocks: {
      values: 0.44,
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
          "data-testid": "stub-json-unbalanced",
          onClick: () => props.onChange(unbalancedJson),
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
jest.mock("../../../components/care/CareVersionsPanel", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({
      versions,
      activeVersion,
      onRollback,
    }: {
      versions: { version: number }[];
      activeVersion: number | null;
      onRollback: (v: number) => void;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "versions-stub",
          "data-count": String(versions.length),
          "data-active": String(activeVersion),
        },
        versions.map((v) =>
          React.createElement("button", {
            key: v.version,
            "data-testid": `stub-rollback-${v.version}`,
            onClick: () => onRollback(v.version),
          }),
        ),
      ),
  };
});
jest.mock("../../../components/care/CareProfilesPanel", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: {
      profiles: { builtin: boolean }[];
      selectedId: string | null;
      modified: boolean;
      onSelect: (id: string) => void;
      onSaveAs: () => void;
      onUpdate: () => void;
      onDelete: () => void;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "profiles-stub",
          "data-selected": props.selectedId ?? "",
          "data-modified": String(props.modified),
          "data-count": String(props.profiles.filter((p) => !p.builtin).length),
        },
        React.createElement("button", {
          "data-testid": "stub-profile-select-default",
          onClick: () => props.onSelect("builtin:default"),
        }),
        React.createElement("button", {
          "data-testid": "stub-profile-select-lowchaos",
          onClick: () => props.onSelect("builtin:lowchaos"),
        }),
        React.createElement("button", {
          "data-testid": "stub-profile-select-saved",
          onClick: () => props.onSelect("p1"),
        }),
        React.createElement("button", {
          "data-testid": "stub-profile-save-as",
          onClick: () => props.onSaveAs(),
        }),
        React.createElement("button", {
          "data-testid": "stub-profile-update",
          onClick: () => props.onUpdate(),
        }),
        React.createElement("button", {
          "data-testid": "stub-profile-delete",
          onClick: () => props.onDelete(),
        }),
      ),
  };
});

jest.mock("../../../services/careFormulaService", () => ({
  __esModule: true,
  getActiveFormula: jest.fn(),
  validateFormula: jest.fn(),
  simulateFormula: jest.fn(),
  previewFormula: jest.fn(),
  normalizeFormulaBlocks: jest.fn(),
  saveFormula: jest.fn(),
  listFormulaVersions: jest.fn(),
  rollbackFormula: jest.fn(),
}));

jest.mock("../../../services/careProfileService", () => ({
  __esModule: true,
  listProfiles: jest.fn(),
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
  deleteProfile: jest.fn(),
}));

const mockGetActive = getActiveFormula as jest.Mock;
const mockValidate = validateFormula as jest.Mock;
const mockSimulate = simulateFormula as jest.Mock;
const mockPreview = previewFormula as jest.Mock;
const mockNormalize = normalizeFormulaBlocks as jest.Mock;
const mockSave = saveFormula as jest.Mock;
const mockListVersions = listFormulaVersions as jest.Mock;
const mockRollback = rollbackFormula as jest.Mock;
const mockListProfiles = listProfiles as jest.Mock;
const mockCreateProfile = createProfile as jest.Mock;
const mockUpdateProfile = updateProfile as jest.Mock;
const mockDeleteProfile = deleteProfile as jest.Mock;

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

const previewEvaluation = (score: number) => ({
  score,
  base: score,
  chi: 0,
  breakdown: {
    values: 0.5,
    relationship_goals: 0.5,
    neurodiversity: 0.5,
    responsiveness: 0.5,
    music: 0.5,
    love_language: 0.5,
    communication_style: 0.5,
    chaos_applied: 0,
    saturated: false,
    compatibility_label: "media",
    final_score: score,
  },
});

const mockPreviewResult = {
  current: previewEvaluation(0.52),
  proposed: previewEvaluation(0.58),
  deltas: {
    values: 0.1,
    relationship_goals: -0.05,
    neurodiversity: 0,
    responsiveness: 0,
    music: 0,
    love_language: 0,
    communication_style: 0,
  },
  chi_current: 0,
  chi_proposed: 0,
  narrative: {
    tone: "directo" as const,
    text: "Suben los valores compartidos.",
    label: "Valores compartidos",
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery = {};
  mockGetActive.mockResolvedValue(active);
  mockValidate.mockResolvedValue({ valid: true, errors: [] });
  mockSimulate.mockResolvedValue(mockResult);
  mockNormalize.mockImplementation(async (blocks: Record<string, number>) => ({
    blocks,
  }));
  mockListVersions.mockResolvedValue([]);
  mockListProfiles.mockResolvedValue([]);
});

const headerBlocks = (): Record<string, number> =>
  JSON.parse(
    screen.getByTestId("header-stub").getAttribute("data-blocks") as string,
  );

describe("CareEquationPage / load + draft", () => {
  it("shows a loading indicator before the active formula resolves", () => {
    mockGetActive.mockReturnValue(new Promise(() => {}));
    renderWithTheme(<CareEquationPage />);
    expect(screen.getByTestId("equation-loading")).toBeInTheDocument();
  });

  it("applies the criteria draft from the router query and emphasizes focus", async () => {
    mockQuery = {
      source: "criteria",
      focus: "music",
      w: JSON.stringify(draftBlocks),
    };
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    expect(screen.getByTestId("header-stub")).toHaveAttribute(
      "data-focus",
      "music",
    );
    expect(headerBlocks()).toEqual(draftBlocks);
  });

  it("uses the active blocks when no draft is present", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    expect(headerBlocks()).toEqual(active.blocks);
    expect(screen.getByTestId("header-stub")).toHaveAttribute("data-focus", "");
  });

  it("renders an error when the active formula fails to load", async () => {
    mockGetActive.mockRejectedValueOnce(new Error("boom"));
    renderWithTheme(<CareEquationPage />);
    expect(await screen.findByTestId("equation-error")).toHaveTextContent(
      "No se pudo cargar la fórmula activa.",
    );
  });
});

describe("CareEquationPage / KPIs de cabecera", () => {
  it("renders the criteria KPIs from the active formula", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("kpi-total");
    expect(screen.getByTestId("kpi-total")).toHaveTextContent("100%");
    expect(screen.getByTestId("kpi-total-badge")).toHaveTextContent("Válido");
    expect(screen.getByTestId("kpi-version")).toHaveTextContent(
      "v3 · 2026-10-16 · maria",
    );
    expect(screen.getByTestId("kpi-chaos")).toHaveTextContent(
      "±5% · seed aleatoria",
    );
    expect(mockGetActive).toHaveBeenCalledTimes(1);
  });

  it("flags the total as invalid and blocks Guardar when the sum breaks (JSON)", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("json-stub");
    fireEvent.click(screen.getByTestId("stub-json-unbalanced"));
    expect(screen.getByTestId("kpi-total")).toHaveTextContent("104%");
    expect(screen.getByTestId("kpi-total-badge")).toHaveTextContent("Inválido");
    expect(screen.getByTestId("open-save-modal")).toBeDisabled();
    expect(screen.getByTestId("weights-total")).toHaveTextContent("104%");
  });
});

describe("CareEquationPage / bidirectional JSON", () => {
  it("regenerates the JSON when a block slider changes", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("stub-slide-values-30"));
    expect(
      screen.getByTestId("json-stub").getAttribute("data-value"),
    ).toContain('"values": 0.3');
  });

  it("regenerates the JSON when the chaos slider changes", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("chaos-stub");
    fireEvent.click(screen.getByTestId("stub-chaos"));
    expect(
      screen.getByTestId("json-stub").getAttribute("data-value"),
    ).toContain('"chaos_factor": 10');
  });

  it("applies valid JSON back to the draft", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("json-stub");
    fireEvent.click(screen.getByTestId("stub-json-valid"));
    expect(headerBlocks()).toEqual(draftBlocks);
    expect(screen.getByTestId("json-stub")).toHaveAttribute(
      "data-valid",
      "true",
    );
  });

  it("flags invalid JSON and keeps the last valid draft", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("json-stub");
    fireEvent.click(screen.getByTestId("stub-json-invalid"));
    expect(screen.getByTestId("json-stub")).toHaveAttribute(
      "data-valid",
      "false",
    );
    expect(headerBlocks()).toEqual(active.blocks);
  });
});

describe("CareEquationPage / pesos: locks + normalizar + focus", () => {
  it("ignores slider changes on locked dimensions", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("stub-lock-values"));
    fireEvent.click(screen.getByTestId("stub-slide-values"));
    expect(headerBlocks().values).toBeCloseTo(active.blocks.values);
    expect(screen.getByTestId("criteria-table")).toHaveAttribute(
      "data-locked",
      "values",
    );
  });

  it("normalizes on slider commit with the current blocks and locks", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("stub-lock-values"));
    fireEvent.click(screen.getByTestId("stub-commit-values"));
    await waitFor(() => expect(mockNormalize).toHaveBeenCalledTimes(1));
    expect(mockNormalize).toHaveBeenCalledWith(
      expect.objectContaining({ values: 0.4 }),
      ["values"],
    );
  });

  it("restores the Default profile from the Reestablecer button", async () => {
    mockQuery = {
      w: JSON.stringify({ ...active.blocks, values: 0.44, music: 0.07 }),
    };
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("action-reestablecer"));
    expect(headerBlocks()).toEqual(active.blocks);
    expect(mockNormalize).not.toHaveBeenCalled();
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-selected",
      "builtin:default",
    );
  });

  it("per-row Probar focuses the dimension", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    fireEvent.click(screen.getByTestId("stub-probar-values"));
    expect(screen.getByTestId("header-stub")).toHaveAttribute(
      "data-focus",
      "values",
    );
  });

  it("hovering a criteria row focuses it in the diagram and the table", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    fireEvent.click(screen.getByTestId("stub-hover-values"));
    expect(screen.getByTestId("header-stub")).toHaveAttribute(
      "data-focus",
      "values",
    );
    expect(screen.getByTestId("criteria-table")).toHaveAttribute(
      "data-focus",
      "values",
    );
  });

  it("hovering a diagram node focuses the matching table row", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    fireEvent.click(screen.getByTestId("stub-node-hover-values"));
    expect(screen.getByTestId("header-stub")).toHaveAttribute(
      "data-focus",
      "values",
    );
    expect(screen.getByTestId("criteria-table")).toHaveAttribute(
      "data-focus",
      "values",
    );
  });

  it("flashes the changed dimension in the diagram on a slider change", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    expect(screen.getByTestId("canvas-stub")).toHaveAttribute("data-glow", "");
    fireEvent.click(screen.getByTestId("stub-slide-values"));
    expect(screen.getByTestId("canvas-stub")).toHaveAttribute(
      "data-glow",
      "values",
    );
  });

  it("does not flash a locked dimension on a slider change", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("stub-lock-values"));
    fireEvent.click(screen.getByTestId("stub-slide-values"));
    expect(screen.getByTestId("canvas-stub")).toHaveAttribute("data-glow", "");
  });
});

describe("CareEquationPage / clamp 100%", () => {
  it("clamps a raise that would exceed 100% and shows the limit hint", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("stub-slide-values")); // request 40, no headroom
    expect(screen.getByTestId("weights-total")).toHaveTextContent("100%");
    expect(screen.getByTestId("limit-hint")).toBeInTheDocument();
    expect(screen.getByTestId("open-save-modal")).not.toBeDisabled();
    expect(headerBlocks().values).toBeCloseTo(0.36);
  });

  it("allows raising up to the exact 100% headroom", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("stub-slide-values-30")); // 36 -> 30, sum 94
    fireEvent.click(screen.getByTestId("stub-slide-values")); // request 40 -> clamped to 36
    expect(screen.getByTestId("weights-total")).toHaveTextContent("100%");
    expect(headerBlocks().values).toBeCloseTo(0.36);
    expect(screen.getByTestId("limit-hint")).toBeInTheDocument();
  });

  it("lowers without clamping and without the hint", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("stub-slide-values-30"));
    expect(screen.getByTestId("weights-total")).toHaveTextContent("94%");
    expect(screen.queryByTestId("limit-hint")).not.toBeInTheDocument();
    expect(headerBlocks().values).toBeCloseTo(0.3);
  });
});

describe("CareEquationPage / glosario de símbolos", () => {
  it("renders the compact glossary with the Ψ/M notation", async () => {
    renderWithTheme(<CareEquationPage />);
    const glossary = await screen.findByTestId("glossary");
    for (const symbol of ["wᵢ", "fᵢ", "Σ", "χ(t)"]) {
      expect(within(glossary).getByText(symbol)).toBeInTheDocument();
    }
    expect(glossary).toHaveTextContent("GLOSARIO DE SÍMBOLOS");
  });
});

describe("CareEquationPage / Probar fórmula", () => {
  it("validates and surfaces backend errors without simulating", async () => {
    mockValidate.mockResolvedValueOnce({
      valid: false,
      errors: ["La suma de pesos debe ser exactamente 1.0"],
    });
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("action-probar"));
    await waitFor(() => expect(mockValidate).toHaveBeenCalledTimes(1));
    expect(mockValidate).toHaveBeenCalledWith(
      expect.objectContaining({ blocks: active.blocks, chaos_factor: 5 }),
    );
    expect(await screen.findByTestId("validate-errors")).toHaveTextContent(
      "La suma de pesos debe ser exactamente 1.0",
    );
    expect(mockSimulate).not.toHaveBeenCalled();
  });

  it("simulates when valid and feeds the table + chaos Δ", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("action-probar"));
    await waitFor(() => expect(mockSimulate).toHaveBeenCalledTimes(1));
    expect(mockSimulate).toHaveBeenCalledWith({
      formula: expect.objectContaining({ blocks: active.blocks }),
    });
    expect(screen.getByTestId("sim-stub")).toHaveAttribute(
      "data-has-result",
      "true",
    );
    expect(screen.getByTestId("chaos-stub")).toHaveAttribute(
      "data-delta",
      "0.075",
    );
  });

  it("pulses the Ψ diagram when Probar runs", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    expect(screen.getByTestId("canvas-stub")).toHaveAttribute(
      "data-pulse",
      "0",
    );
    fireEvent.click(screen.getByTestId("action-probar"));
    expect(screen.getByTestId("canvas-stub")).toHaveAttribute(
      "data-pulse",
      "1",
    );
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
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    fireEvent.click(screen.getByTestId("action-probar"));
    const alerts = await screen.findByTestId("validate-alerts");
    expect(alerts).toHaveTextContent("0%");
    expect(alerts).toHaveTextContent("idénticos");
  });

  it("short-circuits to client validation for an unbalanced sum", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("json-stub");
    fireEvent.click(screen.getByTestId("stub-json-unbalanced"));
    fireEvent.click(screen.getByTestId("action-probar"));
    expect(await screen.findByTestId("validate-errors")).toHaveTextContent(
      "100%",
    );
    expect(mockValidate).not.toHaveBeenCalled();
    expect(mockSimulate).not.toHaveBeenCalled();
  });
});

describe("CareEquationPage / Aplicar Cambios + Versiones", () => {
  const openModal = async () => {
    renderWithTheme(<CareEquationPage />);
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

  it("shows the sum and the deltas vs the active version in the modal", async () => {
    mockQuery = {
      w: JSON.stringify({ ...active.blocks, values: 0.32, music: 0.15 }),
    };
    await openModal();
    expect(screen.getByTestId("modal-sum")).toHaveTextContent("100%");
    expect(screen.getByTestId("delta-values")).toHaveTextContent("-4%");
    expect(screen.getByTestId("delta-music")).toHaveTextContent("+4%");
  });

  it("shows 'sin cambios' when nothing changed", async () => {
    await openModal();
    expect(screen.getByText(/Sin cambios respecto a v3/i)).toBeInTheDocument();
  });

  it("requires a non-empty changelog before enabling Guardar", async () => {
    await openModal();
    expect(screen.getByTestId("modal-save")).toBeDisabled();
    typeChangelog("ajuste de pesos");
    expect(screen.getByTestId("modal-save")).not.toBeDisabled();
  });

  it("normalizes then saves with source equation and the typed changelog", async () => {
    const saved = { ...active, version: 4, changelog: "nuevo" };
    mockSave.mockResolvedValueOnce(saved);
    await openModal();
    typeChangelog("ajuste de pesos");
    fireEvent.click(screen.getByTestId("modal-save"));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockNormalize).toHaveBeenCalled();
    const [payload, source] = mockSave.mock.calls[0];
    expect(source).toBe("equation");
    expect(payload.changelog).toBe("ajuste de pesos");
    expect(payload.blocks).toEqual(active.blocks);
    expect(await screen.findByTestId("save-success")).toHaveTextContent("v4");
    expect(screen.getByTestId("versions-stub")).toHaveAttribute(
      "data-count",
      "1",
    );
    expect(screen.getByTestId("kpi-version")).toHaveTextContent("v4");
  });

  it("surfaces a 409 no-change message and keeps the modal open", async () => {
    mockSave.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: { detail: "No hay cambios respecto a la versión activa." },
      },
    });
    await openModal();
    typeChangelog("x");
    fireEvent.click(screen.getByTestId("modal-save"));
    expect(await screen.findByTestId("save-error")).toHaveTextContent(
      "No hay cambios",
    );
    expect(screen.getByTestId("save-modal")).toBeInTheDocument();
  });

  it("rolls back the chosen version and refreshes the draft", async () => {
    const rolled = {
      ...active,
      version: 5,
      status: "active",
      blocks: {
        values: 0.3,
        relationship_goals: 0.28,
        neurodiversity: 0.15,
        responsiveness: 0.1,
        music: 0.07,
        love_language: 0.06,
        communication_style: 0.04,
      },
    };
    mockListVersions.mockResolvedValueOnce([
      { ...active, version: 2, status: "archived" },
    ]);
    mockRollback.mockResolvedValueOnce(rolled);
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("criteria-table");
    expect(headerBlocks()).toEqual(active.blocks);
    fireEvent.click(await screen.findByTestId("stub-rollback-2"));
    await waitFor(() => expect(mockRollback).toHaveBeenCalledWith(2));
    await waitFor(() =>
      expect(screen.getByTestId("versions-stub")).toHaveAttribute(
        "data-active",
        "5",
      ),
    );
    expect(headerBlocks()).toEqual(rolled.blocks);
    expect(screen.getByTestId("kpi-version")).toHaveTextContent("v5");
  });
});

describe("CareEquationPage / vista previa (buscador A/B)", () => {
  it("keeps Interpretar par disabled until two different users are selected", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    expect(screen.getByTestId("preview-run")).toBeDisabled();
    fireEvent.click(screen.getByTestId("search-a-pick"));
    expect(screen.getByTestId("preview-run")).toBeDisabled();
    fireEvent.click(screen.getByTestId("search-b-pick"));
    expect(screen.getByTestId("preview-run")).toBeEnabled();
  });

  it("stays disabled when both searchers point to the same user", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    fireEvent.click(screen.getByTestId("search-a-pick"));
    fireEvent.click(screen.getByTestId("search-b-pick-a"));
    expect(screen.getByTestId("search-a-value")).toHaveTextContent("u1");
    expect(screen.getByTestId("search-b-value")).toHaveTextContent("u1");
    expect(screen.getByTestId("preview-run")).toBeDisabled();
  });

  it("excludes the opposite selection in each searcher", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    fireEvent.click(screen.getByTestId("search-a-pick"));
    expect(screen.getByTestId("search-b-exclude")).toHaveTextContent("u1");
    fireEvent.click(screen.getByTestId("search-b-pick"));
    expect(screen.getByTestId("search-a-exclude")).toHaveTextContent("u2");
  });

  it("runs the preview with the selected ids and tone", async () => {
    mockPreview.mockResolvedValueOnce(mockPreviewResult);
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    fireEvent.click(screen.getByTestId("search-a-pick"));
    fireEvent.click(screen.getByTestId("search-b-pick"));
    fireEvent.click(screen.getByTestId("tone-poetico"));
    fireEvent.click(screen.getByTestId("preview-run"));
    await waitFor(() => expect(mockPreview).toHaveBeenCalledTimes(1));
    expect(mockPreview).toHaveBeenCalledWith({
      formula: expect.objectContaining({ blocks: active.blocks }),
      user_a_id: "u1",
      user_b_id: "u2",
      tone: "poetico",
    });
    expect(await screen.findByTestId("preview-proposed")).toHaveTextContent(
      "0.580",
    );
  });

  it("clearing a searcher disables Interpretar par again", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("header-stub");
    fireEvent.click(screen.getByTestId("search-a-pick"));
    fireEvent.click(screen.getByTestId("search-b-pick"));
    expect(screen.getByTestId("preview-run")).toBeEnabled();
    fireEvent.click(screen.getByTestId("search-a-clear"));
    expect(screen.getByTestId("preview-run")).toBeDisabled();
  });
});

describe("CareEquationPage / perfiles", () => {
  const savedProfile = {
    id: "p1",
    name: "Mi perfil",
    blocks: { ...CANONICAL_BLOCK_WEIGHTS, values: 0.3, music: 0.17 },
    chaos_factor: 2,
    created_by: "maria",
    created_at: "2026-10-17T00:00:00Z",
    updated_at: "2026-10-17T00:00:00Z",
  };

  it("loads saved profiles on mount", async () => {
    mockListProfiles.mockResolvedValueOnce([savedProfile]);
    renderWithTheme(<CareEquationPage />);
    const stub = await screen.findByTestId("profiles-stub");
    await waitFor(() => expect(stub).toHaveAttribute("data-count", "1"));
  });

  it("falls back to builtins when listing fails", async () => {
    mockListProfiles.mockRejectedValueOnce(new Error("boom"));
    renderWithTheme(<CareEquationPage />);
    const stub = await screen.findByTestId("profiles-stub");
    await waitFor(() => expect(stub).toHaveAttribute("data-count", "0"));
    expect(stub).toHaveAttribute("data-selected", "");
  });

  it("applies the selected profile to the draft", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-select-lowchaos"));
    expect(headerBlocks()).toEqual(CANONICAL_BLOCK_WEIGHTS);
    expect(
      screen.getByTestId("json-stub").getAttribute("data-value"),
    ).toContain('"chaos_factor": 1');
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-selected",
      "builtin:lowchaos",
    );
  });

  it("marks the selection as modified after a manual edit", async () => {
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-select-lowchaos"));
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-modified",
      "false",
    );
    fireEvent.click(screen.getByTestId("stub-slide-values-30"));
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-modified",
      "true",
    );
  });

  it("creates a profile from the save-as flow", async () => {
    const created = { ...savedProfile, id: "p2", name: "Nuevo" };
    mockCreateProfile.mockResolvedValueOnce(created);
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-save-as"));
    const input = screen
      .getByTestId("profile-name-input")
      .querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Nuevo" } });
    fireEvent.click(screen.getByTestId("profile-name-save"));
    await waitFor(() => expect(mockCreateProfile).toHaveBeenCalledTimes(1));
    expect(mockCreateProfile).toHaveBeenCalledWith({
      name: "Nuevo",
      blocks: active.blocks,
      chaos_factor: 5,
    });
    expect(await screen.findByTestId("profile-success")).toHaveTextContent(
      "Nuevo",
    );
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-count",
      "1",
    );
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-selected",
      "p2",
    );
  });

  it("surfaces a duplicate name error in the dialog", async () => {
    mockCreateProfile.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: { detail: "Ya existe un perfil con ese nombre." },
      },
    });
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-save-as"));
    const input = screen
      .getByTestId("profile-name-input")
      .querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Repetido" } });
    fireEvent.click(screen.getByTestId("profile-name-save"));
    expect(await screen.findByTestId("profile-name-error")).toHaveTextContent(
      "Ya existe",
    );
  });

  it("updates a saved profile after confirmation", async () => {
    mockListProfiles.mockResolvedValueOnce([savedProfile]);
    mockUpdateProfile.mockResolvedValueOnce({
      ...savedProfile,
      chaos_factor: 5,
    });
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-select-saved"));
    fireEvent.click(screen.getByTestId("stub-profile-update"));
    fireEvent.click(screen.getByTestId("profile-confirm-accept"));
    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith("p1", {
        blocks: savedProfile.blocks,
        chaos_factor: 2,
      }),
    );
    expect(await screen.findByTestId("profile-success")).toHaveTextContent(
      "actualizado",
    );
  });

  it("deletes a saved profile after confirmation and clears selection", async () => {
    mockListProfiles.mockResolvedValueOnce([savedProfile]);
    mockDeleteProfile.mockResolvedValueOnce(undefined);
    renderWithTheme(<CareEquationPage />);
    await screen.findByTestId("profiles-stub");
    fireEvent.click(screen.getByTestId("stub-profile-select-saved"));
    fireEvent.click(screen.getByTestId("stub-profile-delete"));
    fireEvent.click(screen.getByTestId("profile-confirm-accept"));
    await waitFor(() => expect(mockDeleteProfile).toHaveBeenCalledWith("p1"));
    await waitFor(() =>
      expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
        "data-count",
        "0",
      ),
    );
    expect(screen.getByTestId("profiles-stub")).toHaveAttribute(
      "data-selected",
      "",
    );
  });
});
