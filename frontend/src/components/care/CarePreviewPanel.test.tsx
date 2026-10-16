import { render, screen, fireEvent } from "@testing-library/react";
import CarePreviewPanel from "./CarePreviewPanel";
import type {
  EvaluationResult,
  PreviewResult,
} from "../../services/careFormulaService";

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
  userA: "",
  userB: "",
  tone: "directo",
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

describe("CarePreviewPanel", () => {
  it("emits field + tone changes and runs", () => {
    const onUserAChange = jest.fn();
    const onUserBChange = jest.fn();
    const onRun = jest.fn();
    render(
      <CarePreviewPanel
        {...baseProps}
        userA="a"
        userB="b"
        onUserAChange={onUserAChange}
        onUserBChange={onUserBChange}
        onRun={onRun}
      />,
    );
    fireEvent.change(
      screen
        .getByTestId("preview-user-a")
        .querySelector("input") as HTMLInputElement,
      { target: { value: "u1" } },
    );
    fireEvent.change(
      screen
        .getByTestId("preview-user-b")
        .querySelector("input") as HTMLInputElement,
      { target: { value: "u2" } },
    );
    fireEvent.click(screen.getByTestId("preview-run"));
    expect(onUserAChange).toHaveBeenCalledWith("u1");
    expect(onUserBChange).toHaveBeenCalledWith("u2");
    expect(onRun).toHaveBeenCalledTimes(1);
  });

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
