import { render, screen } from "@testing-library/react";
import CareSimulationTable from "./CareSimulationTable";

const result = {
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

describe("CareSimulationTable", () => {
  it("renders nothing when there is no result", () => {
    const { container } = render(<CareSimulationTable result={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a loading indicator", () => {
    render(<CareSimulationTable result={null} loading />);
    expect(screen.getByTestId("simulation-loading")).toBeInTheDocument();
  });

  it("renders one row per candidate plus the mock chip and mean delta", () => {
    render(<CareSimulationTable result={result} />);
    expect(screen.getByTestId("sim-row-c1")).toBeInTheDocument();
    expect(screen.getByTestId("sim-row-c2")).toBeInTheDocument();
    expect(screen.getByTestId("sim-mock")).toHaveTextContent("Datos mock");
    expect(screen.getByTestId("sim-without-chi-c1")).toHaveTextContent("0.580");
    expect(screen.getByTestId("sim-delta-c2")).toHaveTextContent("+0.050");
    expect(screen.getByTestId("sim-mean-delta")).toHaveTextContent("+0.075");
  });
});
