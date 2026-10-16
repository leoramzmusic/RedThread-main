import { render, screen } from "@testing-library/react";
import CareBreakdownBars from "./CareBreakdownBars";
import { CARE_DIMENSIONS } from "../../constants/careDimensions";

describe("CareBreakdownBars", () => {
  it("renders all 7 canonical dimension labels", () => {
    render(
      <CareBreakdownBars
        breakdown={{
          values: 80,
          relationship_goals: 50,
          neurodiversity: 100,
          responsiveness: 10,
          music: 11,
          love_language: 6,
          communication_style: 4,
        }}
      />,
    );
    CARE_DIMENSIONS.forEach((d) => {
      expect(screen.getByText(d.label)).toBeInTheDocument();
    });
  });

  it("exposes 0-100 values in data-value and the chip letter", () => {
    render(<CareBreakdownBars breakdown={{ values: 80, music: 11 }} />);
    expect(screen.getByTestId("care-bar-values")).toHaveAttribute(
      "data-value",
      "80",
    );
    expect(screen.getByTestId("care-bar-music")).toHaveAttribute(
      "data-value",
      "11",
    );
    expect(screen.getByTestId("care-chip-values")).toHaveTextContent("α");
    expect(screen.getByTestId("care-chip-music")).toHaveTextContent("ε");
  });

  it("scales 0-1 values to 0-100 when valueRange='0-1'", () => {
    render(<CareBreakdownBars breakdown={{ values: 0.8 }} valueRange="0-1" />);
    expect(screen.getByTestId("care-bar-values")).toHaveAttribute(
      "data-value",
      "80",
    );
  });

  it("treats missing dimensions as zero without crashing", () => {
    render(<CareBreakdownBars breakdown={{ music: 11 }} />);
    expect(screen.getByTestId("care-bar-values")).toHaveAttribute(
      "data-value",
      "0",
    );
    expect(screen.getByTestId("care-bar-communication_style")).toHaveAttribute(
      "data-value",
      "0",
    );
  });

  it("renders zeros when breakdown is null", () => {
    render(<CareBreakdownBars breakdown={null} />);
    expect(screen.getByTestId("care-bar-neurodiversity")).toHaveAttribute(
      "data-value",
      "0",
    );
  });
});
