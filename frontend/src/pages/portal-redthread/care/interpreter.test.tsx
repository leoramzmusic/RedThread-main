import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CareInterpreterPage from "./interpreter";
import {
  getActiveFormula,
  previewFormula,
} from "../../../services/careFormulaService";
import { downloadJson } from "../../../utils/careInterpreterModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../../../constants/careDimensions";

jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock("../../../components/layout/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../context/ThemeContext", () => ({
  useAppTheme: () => ({ mode: "light" }),
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
    default: ({
      label,
      value,
      onChange,
      excludeId,
    }: {
      label?: string;
      value: { id: string } | null;
      onChange: (user: (typeof USERS)["a"] | null) => void;
      excludeId?: string | null;
    }) => {
      const key = label === "Usuario A" ? "a" : "b";
      return React.createElement(
        "div",
        { "data-testid": `search-${key}` },
        React.createElement(
          "span",
          { "data-testid": `search-${key}-value` },
          value?.id ?? "",
        ),
        React.createElement(
          "span",
          { "data-testid": `search-${key}-exclude` },
          excludeId ?? "",
        ),
        React.createElement("button", {
          "data-testid": `search-${key}-pick`,
          onClick: () => onChange(USERS[key]),
        }),
        React.createElement("button", {
          "data-testid": `search-${key}-pick-a`,
          onClick: () => onChange(USERS.a),
        }),
        React.createElement("button", {
          "data-testid": `search-${key}-clear`,
          onClick: () => onChange(null),
        }),
      );
    },
  };
});

jest.mock("../../../components/care/CareScoreBreakdown", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: { rows: unknown[] }) =>
      React.createElement("div", {
        "data-testid": "breakdown-stub",
        "data-rows": String(props.rows.length),
      }),
  };
});
jest.mock("../../../components/care/CareNarrativeTrio", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: { compatibilityLabel: string }) =>
      React.createElement("div", {
        "data-testid": "trio-stub",
        "data-label": props.compatibilityLabel,
      }),
  };
});

jest.mock("../../../utils/careInterpreterModel", () => {
  const actual = jest.requireActual("../../../utils/careInterpreterModel");
  return { ...actual, downloadJson: jest.fn() };
});

jest.mock("../../../services/careFormulaService", () => ({
  __esModule: true,
  getActiveFormula: jest.fn(),
  previewFormula: jest.fn(),
}));

const mockGetActive = getActiveFormula as jest.Mock;
const mockPreview = previewFormula as jest.Mock;
const mockDownload = downloadJson as jest.Mock;

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

const evaluation = (score: number) => ({
  score,
  base: score - 0.02,
  chi: 0.02,
  breakdown: {
    values: 0.5,
    relationship_goals: 0.5,
    neurodiversity: 0.5,
    responsiveness: 0.5,
    music: 0.5,
    love_language: 0.5,
    communication_style: 0.5,
    chaos_applied: 0.02,
    saturated: false,
    compatibility_label: "Medio",
    final_score: score,
  },
});

const previewResponse = {
  current: evaluation(0.52),
  proposed: evaluation(0.6),
  deltas: { values: 0.1 },
  chi_current: 0,
  chi_proposed: 0.02,
  narrative: { tone: "directo", text: "Suben los valores.", label: "Medio" },
};

const pickUsers = () => {
  fireEvent.click(screen.getByTestId("search-a-pick"));
  fireEvent.click(screen.getByTestId("search-b-pick"));
};

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetActive.mockResolvedValue(active);
  mockPreview.mockResolvedValue(previewResponse);
  URL.createObjectURL = jest.fn(() => "blob:care-report");
  URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

describe("CareInterpreterPage / load", () => {
  it("shows a loading indicator before the active formula resolves", () => {
    mockGetActive.mockReturnValue(new Promise(() => {}));
    render(<CareInterpreterPage />);
    expect(screen.getByTestId("interpreter-loading")).toBeInTheDocument();
  });

  it("renders an error state when the active formula fails to load", async () => {
    mockGetActive.mockRejectedValueOnce(new Error("boom"));
    render(<CareInterpreterPage />);
    expect(await screen.findByTestId("interpreter-error")).toHaveTextContent(
      "No se pudo cargar la fórmula activa.",
    );
  });

  it("does not render the legacy mock usuario_12345 or '24 fragmentos'", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-empty");
    expect(screen.queryByText(/usuario_12345/)).not.toBeInTheDocument();
    expect(screen.queryByText(/24 fragmentos/)).not.toBeInTheDocument();
  });
});

describe("CareInterpreterPage / preview", () => {
  const run = async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-run");
    pickUsers();
    fireEvent.click(screen.getByTestId("interpreter-run"));
  };

  it("previews the active formula for the two user ids and the selected tone", async () => {
    await run();
    await waitFor(() => expect(mockPreview).toHaveBeenCalledTimes(1));
    expect(mockPreview).toHaveBeenCalledWith({
      formula: expect.objectContaining({
        blocks: active.blocks,
        chaos_factor: 5,
      }),
      user_a_id: "u1",
      user_b_id: "u2",
      tone: "directo",
    });
  });

  it("sends the chosen tone", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-run");
    pickUsers();
    fireEvent.click(screen.getByTestId("interpreter-tone-poetico"));
    fireEvent.click(screen.getByTestId("interpreter-run"));
    await waitFor(() =>
      expect(mockPreview).toHaveBeenCalledWith(
        expect.objectContaining({ tone: "poetico" }),
      ),
    );
  });

  it("renders 7 breakdown rows and the backend band label", async () => {
    await run();
    expect(await screen.findByTestId("breakdown-stub")).toHaveAttribute(
      "data-rows",
      "7",
    );
    expect(screen.getByTestId("trio-stub")).toHaveAttribute(
      "data-label",
      "Medio",
    );
  });

  it("surfaces a 404 preview error in Spanish", async () => {
    mockPreview.mockRejectedValueOnce({ response: { status: 404 } });
    await run();
    expect(
      await screen.findByTestId("interpreter-preview-error"),
    ).toHaveTextContent("Usuario o perfil no encontrado.");
  });

  it("surfaces a 422 preview error detail", async () => {
    mockPreview.mockRejectedValueOnce({
      response: {
        status: 422,
        data: { detail: "user_a_id y user_b_id son requeridos" },
      },
    });
    await run();
    expect(
      await screen.findByTestId("interpreter-preview-error"),
    ).toHaveTextContent("user_a_id y user_b_id son requeridos");
  });
});

describe("CareInterpreterPage / export", () => {
  it("disables the export until a preview result exists", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-export");
    expect(screen.getByTestId("interpreter-export")).toBeDisabled();
  });

  it("downloads the report JSON with the spec fields", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-run");
    pickUsers();
    fireEvent.click(screen.getByTestId("interpreter-run"));
    await screen.findByTestId("trio-stub");
    fireEvent.click(screen.getByTestId("interpreter-export"));
    expect(mockDownload).toHaveBeenCalledTimes(1);
    const [filename, report] = mockDownload.mock.calls[0];
    expect(filename).toMatch(/^care-report_u1_u2_\d{14}\.json$/);
    expect(report).toEqual(
      expect.objectContaining({
        user_a: "u1",
        user_b: "u2",
        formula_version: 3,
        chi: 0.02,
        tone: "directo",
        compatibility_label: "Medio",
        narrative: previewResponse.narrative,
      }),
    );
    expect(report.breakdown).toHaveLength(7);
    expect(typeof report.generated_at).toBe("string");
  });

  it("disables Export when a selected user is cleared after a preview", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-run");
    pickUsers();
    fireEvent.click(screen.getByTestId("interpreter-run"));
    await screen.findByTestId("trio-stub");
    expect(screen.getByTestId("interpreter-export")).toBeEnabled();
    fireEvent.click(screen.getByTestId("search-a-clear"));
    expect(screen.getByTestId("interpreter-export")).toBeDisabled();
  });
});

describe("CareInterpreterPage / user search", () => {
  it("keeps Interpretar disabled until both users are selected", async () => {
    render(<CareInterpreterPage />);
    const runButton = await screen.findByTestId("interpreter-run");
    expect(runButton).toBeDisabled();
    fireEvent.click(screen.getByTestId("search-a-pick"));
    expect(runButton).toBeDisabled();
    fireEvent.click(screen.getByTestId("search-b-pick"));
    expect(runButton).toBeEnabled();
  });

  it("cross-excludes the profile already selected on the other side", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-run");
    pickUsers();
    expect(screen.getByTestId("search-a-exclude")).toHaveTextContent("u2");
    expect(screen.getByTestId("search-b-exclude")).toHaveTextContent("u1");
  });

  it("blocks running when both sides hold the same profile", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("interpreter-run");
    fireEvent.click(screen.getByTestId("search-a-pick"));
    fireEvent.click(screen.getByTestId("search-b-pick-a"));
    const runButton = screen.getByTestId("interpreter-run");
    expect(runButton).toBeDisabled();
    fireEvent.click(runButton);
    expect(mockPreview).not.toHaveBeenCalled();
  });
});
