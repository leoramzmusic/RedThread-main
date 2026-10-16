import { render, screen, fireEvent } from "@testing-library/react";
import CareEquationBlocks from "./CareEquationBlocks";
import { CANONICAL_BLOCK_WEIGHTS } from "../../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

const sliderInput = (key: string): HTMLInputElement =>
  screen
    .getByTestId(`eq-slider-${key}`)
    .querySelector("input") as HTMLInputElement;

describe("CareEquationBlocks", () => {
  it("renders a chip, percent and example fᵢ for each dimension", () => {
    render(
      <CareEquationBlocks blocks={canonical} onSliderChange={jest.fn()} />,
    );
    expect(screen.getByTestId("eq-chip-values")).toHaveTextContent("α");
    expect(screen.getByTestId("eq-percent-values")).toHaveTextContent("36%");
    expect(screen.getByTestId("eq-example-values")).toHaveTextContent("0.8");
  });

  it("emits onSliderChange with the key and integer percent", () => {
    const onSliderChange = jest.fn();
    render(
      <CareEquationBlocks blocks={canonical} onSliderChange={onSliderChange} />,
    );
    fireEvent.change(sliderInput("values"), { target: { value: "40" } });
    expect(onSliderChange).toHaveBeenCalledWith("values", 40);
  });

  it("marks the focused row", () => {
    render(
      <CareEquationBlocks
        blocks={canonical}
        focus="music"
        onSliderChange={jest.fn()}
      />,
    );
    expect(screen.getByTestId("eq-block-music")).toHaveAttribute(
      "data-focus",
      "true",
    );
    expect(screen.getByTestId("eq-block-values")).toHaveAttribute(
      "data-focus",
      "false",
    );
  });
});
