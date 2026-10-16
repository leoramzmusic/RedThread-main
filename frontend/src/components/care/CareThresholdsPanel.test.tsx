import { render, screen, fireEvent } from "@testing-library/react";
import CareThresholdsPanel from "./CareThresholdsPanel";

describe("CareThresholdsPanel", () => {
  it("renders both thresholds with helper text", () => {
    render(
      <CareThresholdsPanel
        minCompatibility={0}
        matchCritical={0.15}
        onMinChange={jest.fn()}
        onMatchChange={jest.fn()}
      />,
    );
    const min = screen
      .getByTestId("threshold-min")
      .querySelector("input") as HTMLInputElement;
    const match = screen
      .getByTestId("threshold-match")
      .querySelector("input") as HTMLInputElement;
    expect(min.value).toBe("0");
    expect(match.value).toBe("0.15");
    expect(screen.getByText(/Gate mínimo/i)).toBeInTheDocument();
    expect(screen.getByText(/default 0.15/i)).toBeInTheDocument();
  });

  it("emits numeric changes", () => {
    const onMinChange = jest.fn();
    const onMatchChange = jest.fn();
    render(
      <CareThresholdsPanel
        minCompatibility={0}
        matchCritical={0.15}
        onMinChange={onMinChange}
        onMatchChange={onMatchChange}
      />,
    );
    const min = screen
      .getByTestId("threshold-min")
      .querySelector("input") as HTMLInputElement;
    fireEvent.change(min, { target: { value: "0.2" } });
    expect(onMinChange).toHaveBeenCalledWith(0.2);
  });
});
