import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CareInterpreterPage from "./interpreter";
import {
  exportPreferences,
  getPreferenceInsights,
  listAllPreferences,
} from "../../../services/carePreferencesAdminService";
import { downloadJson } from "../../../utils/careInterpreterModel";

jest.mock("../../../components/layout/AdminLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("../../../context/ThemeContext", () => ({
  useAppTheme: () => ({ mode: "light" }),
}));

jest.mock("../../../services/carePreferencesAdminService", () => ({
  getPreferenceInsights: jest.fn(),
  listAllPreferences: jest.fn(),
  exportPreferences: jest.fn(),
}));

jest.mock("../../../utils/careInterpreterModel", () => {
  const actual = jest.requireActual("../../../utils/careInterpreterModel");
  return { ...actual, downloadJson: jest.fn() };
});

const mockInsights = getPreferenceInsights as jest.Mock;
const mockList = listAllPreferences as jest.Mock;
const mockExport = exportPreferences as jest.Mock;
const mockDownload = downloadJson as jest.Mock;

const preference = {
  id: "p1",
  user_id: "u1",
  dimension: "values",
  tag: "appearance",
  score: 80,
  created_at: "2026-10-19T10:00:00",
  updated_at: "2026-10-19T10:00:00",
};

const insights = {
  generated_at: "2026-10-19T00:00:00",
  total_records: 2,
  unique_users: 1,
  dimensions: [{ dimension: "values", count: 2, avg_score: 80 }],
  tags: [{ tag: "appearance", count: 1, avg_score: 80 }],
  top_dimensions: [{ dimension: "values", count: 2, avg_score: 80 }],
};

const dataset = {
  items: [preference],
  total: 2,
  limit: 100,
  offset: 0,
};

const exported = {
  date: "2026-10-19",
  count: 2,
  files: {
    json: "backend/exports/preferences/2026-10-19.json",
    csv: "backend/exports/preferences/2026-10-19.csv",
  },
  records: [preference],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockInsights.mockResolvedValue(insights);
  mockList.mockResolvedValue(dataset);
  mockExport.mockResolvedValue(exported);
  URL.createObjectURL = jest.fn(() => "blob:preferences");
  URL.revokeObjectURL = jest.fn();
});

describe("CareInterpreterPage / load", () => {
  it("shows a loading indicator while the repository loads", () => {
    mockInsights.mockReturnValue(new Promise(() => {}));
    mockList.mockReturnValue(new Promise(() => {}));
    render(<CareInterpreterPage />);
    expect(screen.getByTestId("preferences-loading")).toBeInTheDocument();
  });

  it("renders KPIs, top dimensions and the dataset", async () => {
    render(<CareInterpreterPage />);
    expect(await screen.findByTestId("preferences-total")).toHaveTextContent(
      "2",
    );
    expect(screen.getByTestId("preferences-users")).toHaveTextContent("1");
    expect(screen.getByTestId("preferences-top-values")).toHaveTextContent(
      "Valores",
    );
    expect(screen.getByTestId("preferences-row-p1")).toHaveTextContent(
      "appearance",
    );
  });

  it("surfaces a load error in Spanish", async () => {
    mockInsights.mockRejectedValueOnce(new Error("boom"));
    mockList.mockRejectedValueOnce(new Error("boom"));
    render(<CareInterpreterPage />);
    expect(await screen.findByTestId("preferences-error")).toHaveTextContent(
      "No se pudieron cargar las preferencias.",
    );
  });
});

describe("CareInterpreterPage / filters and export", () => {
  it("reloads the dataset when a dimension filter is selected", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("preferences-dataset");
    fireEvent.mouseDown(screen.getByTestId("preferences-filter"));
    fireEvent.click(screen.getByRole("option", { name: "Valores" }));
    await waitFor(() =>
      expect(mockList).toHaveBeenCalledWith({
        limit: 100,
        dimension: "values",
      }),
    );
  });

  it("downloads the JSON snapshot and shows the export summary", async () => {
    render(<CareInterpreterPage />);
    await screen.findByTestId("preferences-dataset");
    fireEvent.click(screen.getByTestId("preferences-export"));
    await waitFor(() => expect(mockExport).toHaveBeenCalledTimes(1));
    expect(mockDownload).toHaveBeenCalledWith(
      "preferences-2026-10-19.json",
      exported,
    );
    expect(
      await screen.findByTestId("preferences-export-alert"),
    ).toHaveTextContent("2 filas");
  });

  it("shows the empty state when there are no preferences", async () => {
    mockInsights.mockResolvedValue({
      ...insights,
      total_records: 0,
      unique_users: 0,
      dimensions: [],
      tags: [],
      top_dimensions: [],
    });
    mockList.mockResolvedValue({ items: [], total: 0, limit: 100, offset: 0 });
    render(<CareInterpreterPage />);
    expect(await screen.findByTestId("preferences-empty")).toHaveTextContent(
      "Aún no hay preferencias registradas.",
    );
    expect(screen.getByTestId("preferences-top-empty")).toBeInTheDocument();
  });
});
