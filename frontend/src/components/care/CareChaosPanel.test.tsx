import { render, screen, fireEvent } from "@testing-library/react";
import CareChaosPanel from "./CareChaosPanel";

const sliderInput = (): HTMLInputElement =>
  screen.getByTestId("chaos-slider").querySelector("input") as HTMLInputElement;

describe("CareChaosPanel", () => {
  it("labels the slider as the max deviation", () => {
    render(
      <CareChaosPanel
        chaosFactor={5}
        chaosSeed={null}
        onChaosChange={jest.fn()}
        onSeedChange={jest.fn()}
        onGenerateSeed={jest.fn()}
      />,
    );
    expect(screen.getByTestId("chaos-label")).toHaveTextContent(
      "±5% desviación máxima",
    );
  });

  it("emits onChaosChange with the slider value", () => {
    const onChaosChange = jest.fn();
    render(
      <CareChaosPanel
        chaosFactor={5}
        chaosSeed={null}
        onChaosChange={onChaosChange}
        onSeedChange={jest.fn()}
        onGenerateSeed={jest.fn()}
      />,
    );
    fireEvent.change(sliderInput(), { target: { value: "12" } });
    expect(onChaosChange).toHaveBeenCalledWith(12);
  });

  it("emits onSeedChange (and null when cleared) and triggers seed generation", () => {
    const onSeedChange = jest.fn();
    const onGenerateSeed = jest.fn();
    render(
      <CareChaosPanel
        chaosFactor={5}
        chaosSeed="abc"
        onChaosChange={jest.fn()}
        onSeedChange={onSeedChange}
        onGenerateSeed={onGenerateSeed}
      />,
    );
    const input = screen
      .getByTestId("chaos-seed")
      .querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "seed-9" } });
    expect(onSeedChange).toHaveBeenCalledWith("seed-9");
    fireEvent.change(input, { target: { value: "" } });
    expect(onSeedChange).toHaveBeenLastCalledWith(null);
    fireEvent.click(screen.getByTestId("chaos-generate-seed"));
    expect(onGenerateSeed).toHaveBeenCalledTimes(1);
  });

  it("shows the Δ indicator, or — when absent", () => {
    const { rerender } = render(
      <CareChaosPanel
        chaosFactor={5}
        chaosSeed={null}
        onChaosChange={jest.fn()}
        onSeedChange={jest.fn()}
        onGenerateSeed={jest.fn()}
      />,
    );
    expect(screen.getByTestId("chaos-delta")).toHaveTextContent("—");
    rerender(
      <CareChaosPanel
        chaosFactor={5}
        chaosSeed={null}
        deltaIndicator={0.12}
        onChaosChange={jest.fn()}
        onSeedChange={jest.fn()}
        onGenerateSeed={jest.fn()}
      />,
    );
    expect(screen.getByTestId("chaos-delta")).toHaveTextContent("+0.120");
  });
});
