import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import RelationshipGoalsSection from "./RelationshipGoalsSection";

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
    i18n: { language: "es" },
  }),
}));

function Harness() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { control, setValue, watch } = useForm<any>({
    defaultValues: { relationship_goals: [] },
  });
  return (
    <RelationshipGoalsSection
      control={control}
      setValue={setValue}
      watch={watch}
      setGoalsInfoOpen={() => {}}
    />
  );
}

describe("RelationshipGoalsSection (relationship goals)", () => {
  it("renders every intention option as an unpressed toggle button", () => {
    render(<Harness />);
    const options = screen.getAllByRole("button", { pressed: false });
    expect(options).toHaveLength(8);
  });

  it("toggles aria-pressed on click and allows multiple selections", () => {
    render(<Harness />);
    const options = screen.getAllByRole("button", { pressed: false });

    fireEvent.click(options[0]);
    expect(options[0]).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(options[1]);
    expect(options[0]).toHaveAttribute("aria-pressed", "true");
    expect(options[1]).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(options[0]);
    expect(options[0]).toHaveAttribute("aria-pressed", "false");
    expect(options[1]).toHaveAttribute("aria-pressed", "true");
  });

  it("exposes each option as a native, focusable button for keyboard activation", () => {
    render(<Harness />);
    const option = screen.getAllByRole("button", { pressed: false })[0];
    // Native <button> => browser handles Enter/Space activation; simply assert it is focusable.
    expect(option.tagName).toBe("BUTTON");
    expect(option).toBeEnabled();
    option.focus();
    expect(option).toHaveFocus();
  });
});
