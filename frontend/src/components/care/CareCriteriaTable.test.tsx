import { render, screen, fireEvent } from "@testing-library/react";
import CareCriteriaTable from "./CareCriteriaTable";
import {
  CARE_DIMENSIONS,
  CANONICAL_BLOCK_WEIGHTS,
} from "../../constants/careDimensions";

const canonical = { ...CANONICAL_BLOCK_WEIGHTS };

const setup = (overrides: Record<string, unknown> = {}) => {
  const props = {
    blocks: canonical,
    locked: [] as string[],
    onSliderChange: jest.fn(),
    onSliderCommit: jest.fn(),
    onToggleLock: jest.fn(),
    onProbar: jest.fn(),
    ...overrides,
  };
  render(<CareCriteriaTable {...props} />);
  return props;
};

const sliderInput = (key: string): HTMLInputElement =>
  screen
    .getByTestId(`care-slider-${key}`)
    .querySelector("input") as HTMLInputElement;

describe("CareCriteriaTable", () => {
  it("renders the 7 canonical labels and Dirac chips", () => {
    setup();
    CARE_DIMENSIONS.forEach((d) => {
      expect(screen.getByText(d.label)).toBeInTheDocument();
      expect(screen.getByTestId(`care-chip-${d.key}`)).toHaveTextContent(
        d.chip,
      );
    });
  });

  it("shows each weight as a rounded percentage", () => {
    setup();
    expect(screen.getByTestId("care-percent-values")).toHaveTextContent("36%");
    expect(screen.getByTestId("care-percent-music")).toHaveTextContent("11%");
  });

  it("emits onSliderChange with the dimension key and integer percent", () => {
    const props = setup();
    fireEvent.change(sliderInput("values"), { target: { value: "40" } });
    expect(props.onSliderChange).toHaveBeenCalledWith("values", 40);
  });

  it("emits onToggleLock with the dimension key", () => {
    const props = setup();
    fireEvent.click(screen.getByTestId("care-lock-music"));
    expect(props.onToggleLock).toHaveBeenCalledWith("music");
  });

  it("emits onProbar with the dimension key", () => {
    const props = setup();
    fireEvent.click(screen.getByTestId("care-probar-values"));
    expect(props.onProbar).toHaveBeenCalledWith("values");
  });

  it("disables the slider input of a locked dimension only", () => {
    setup({ locked: ["values"] });
    expect(sliderInput("values").disabled).toBe(true);
    expect(sliderInput("music").disabled).toBe(false);
  });

  it("emits onBlockHover on row enter/leave", () => {
    const onBlockHover = jest.fn();
    setup({ onBlockHover });
    const row = screen.getByTestId("criteria-row-values");
    fireEvent.mouseEnter(row);
    expect(onBlockHover).toHaveBeenCalledWith("values");
    fireEvent.mouseLeave(row);
    expect(onBlockHover).toHaveBeenCalledWith(null);
  });

  it("marks the focused row when the diagram focuses a dimension", () => {
    setup({ focus: "music" });
    expect(screen.getByTestId("criteria-row-music")).toHaveAttribute(
      "data-focus",
      "true",
    );
    expect(screen.getByTestId("criteria-row-values")).toHaveAttribute(
      "data-focus",
      "false",
    );
  });
});
