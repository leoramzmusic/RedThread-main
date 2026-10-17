import { render, screen, fireEvent, within } from "@testing-library/react";
import CarePreviewPanel from "./CarePreviewPanel";
import type { SearchUser } from "../common/UserSearchAutocomplete";
import type {
  EvaluationResult,
  PreviewResult,
} from "../../services/careFormulaService";

jest.mock("../common/UserSearchAutocomplete", () => {
  const React = require("react");
  const USERS: Record<string, SearchUser> = {
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
      value: SearchUser | null;
      onChange: (user: SearchUser | null) => void;
      excludeId?: string | null;
      isDark?: boolean;
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

const USERS: Record<string, SearchUser> = {
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

const evaluation = (score: number): EvaluationResult => ({
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

const baseProps = {
  userA: null as SearchUser | null,
  userB: null as SearchUser | null,
  tone: "directo" as const,
  result: null,
  onUserAChange: jest.fn(),
  onUserBChange: jest.fn(),
  onToneChange: jest.fn(),
  onRun: jest.fn(),
};

const result: PreviewResult = {
  current: evaluation(0.52),
  proposed: evaluation(0.58),
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
  chi_proposed: 0.02,
  narrative: {
    tone: "directo",
    text: "Suben los valores compartidos.",
    label: "Valores compartidos",
  },
};

describe("CarePreviewPanel / buscador A/B", () => {
  it("emits user + tone changes and runs with two different users", () => {
    const onUserAChange = jest.fn();
    const onUserBChange = jest.fn();
    const onToneChange = jest.fn();
    const onRun = jest.fn();
    render(
      <CarePreviewPanel
        {...baseProps}
        userA={USERS.a}
        userB={USERS.b}
        onUserAChange={onUserAChange}
        onUserBChange={onUserBChange}
        onToneChange={onToneChange}
        onRun={onRun}
      />,
    );
    fireEvent.click(screen.getByTestId("search-a-pick"));
    fireEvent.click(screen.getByTestId("search-b-pick"));
    fireEvent.click(screen.getByTestId("tone-poetico"));
    expect(onUserAChange).toHaveBeenCalledWith(USERS.a);
    expect(onUserBChange).toHaveBeenCalledWith(USERS.b);
    expect(onToneChange).toHaveBeenCalledWith("poetico");
    fireEvent.click(screen.getByTestId("preview-run"));
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it("disables Interpretar par until two users are selected", () => {
    const { rerender } = render(<CarePreviewPanel {...baseProps} />);
    expect(screen.getByTestId("preview-run")).toBeDisabled();
    rerender(<CarePreviewPanel {...baseProps} userA={USERS.a} />);
    expect(screen.getByTestId("preview-run")).toBeDisabled();
    rerender(
      <CarePreviewPanel {...baseProps} userA={USERS.a} userB={USERS.b} />,
    );
    expect(screen.getByTestId("preview-run")).toBeEnabled();
  });

  it("disables Interpretar par when both users are the same", () => {
    render(<CarePreviewPanel {...baseProps} userA={USERS.a} userB={USERS.a} />);
    expect(screen.getByTestId("preview-run")).toBeDisabled();
  });

  it("excludes the opposite selection in each searcher", () => {
    render(<CarePreviewPanel {...baseProps} userA={USERS.a} userB={USERS.b} />);
    expect(screen.getByTestId("search-a-exclude")).toHaveTextContent("u2");
    expect(screen.getByTestId("search-b-exclude")).toHaveTextContent("u1");
  });

  it("labels the run button as Interpretar par", () => {
    render(<CarePreviewPanel {...baseProps} />);
    expect(
      within(screen.getByTestId("preview-run")).getByText("Interpretar par"),
    ).toBeInTheDocument();
  });
});

describe("CarePreviewPanel / resultado", () => {
  it("shows a loading indicator", () => {
    render(<CarePreviewPanel {...baseProps} loading />);
    expect(screen.getByTestId("preview-loading")).toBeInTheDocument();
  });

  it("shows a 422/404 error verbatim", () => {
    render(<CarePreviewPanel {...baseProps} error="Usuario no encontrado" />);
    expect(screen.getByTestId("preview-error")).toHaveTextContent(
      "Usuario no encontrado",
    );
  });

  it("renders current/proposed, per-dimension deltas, saturation and narrative", () => {
    render(<CarePreviewPanel {...baseProps} result={result} />);
    expect(screen.getByTestId("preview-current")).toHaveTextContent("0.520");
    expect(screen.getByTestId("preview-proposed")).toHaveTextContent("0.580");
    expect(screen.getByTestId("preview-delta-values")).toHaveTextContent(
      "+0.100",
    );
    expect(
      screen.getByTestId("preview-delta-relationship_goals"),
    ).toHaveTextContent("-0.050");
    expect(screen.getByTestId("preview-saturated")).toBeInTheDocument();
    expect(screen.getByTestId("preview-narrative-text")).toHaveTextContent(
      "Suben los valores compartidos.",
    );
    expect(screen.getByTestId("preview-narrative-label")).toHaveTextContent(
      "Valores compartidos",
    );
  });

  it("renders delta bars on the 0-1 scale (a +0.1 delta is not 0%)", () => {
    render(<CarePreviewPanel {...baseProps} result={result} />);
    const valuesBar = screen.getByTestId("care-bar-values");
    expect(valuesBar).toHaveAttribute("data-value", "10");
    expect(valuesBar).toHaveTextContent("10%");
  });

  it("hides the saturation notice when χ does not change", () => {
    render(
      <CarePreviewPanel
        {...baseProps}
        result={{ ...result, chi_proposed: 0 }}
      />,
    );
    expect(screen.queryByTestId("preview-saturated")).not.toBeInTheDocument();
  });
});
