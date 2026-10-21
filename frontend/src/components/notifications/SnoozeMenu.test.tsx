import { fireEvent, render, screen } from "@testing-library/react";
import SnoozeMenu from "./SnoozeMenu";

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "es" },
  }),
}));

const renderMenu = (onSelect: (duration: string) => void) => {
  const anchorEl = document.createElement("div");
  document.body.appendChild(anchorEl);
  const onClose = jest.fn();
  render(
    <SnoozeMenu
      anchorEl={anchorEl}
      open
      onClose={onClose}
      onSelect={onSelect}
    />,
  );
  return { onClose };
};

it("selects the 1h duration", () => {
  const onSelect = jest.fn();
  const { onClose } = renderMenu(onSelect);

  fireEvent.click(screen.getByTestId("snooze-option-1h"));

  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("1h");
  expect(onClose).toHaveBeenCalled();
});

it("offers the five presets and omits the legacy always option", () => {
  const onSelect = jest.fn();
  renderMenu(onSelect);

  for (const option of ["15m", "30m", "1h", "4h", "1d"]) {
    expect(screen.getByTestId(`snooze-option-${option}`)).toBeInTheDocument();
  }
  expect(screen.queryByTestId("snooze-option-always")).not.toBeInTheDocument();
  expect(screen.queryByTestId("snooze-option-2h")).not.toBeInTheDocument();
  expect(screen.queryByTestId("snooze-option-8h")).not.toBeInTheDocument();
});

it("selects the 30m duration", () => {
  const onSelect = jest.fn();
  const { onClose } = renderMenu(onSelect);

  fireEvent.click(screen.getByTestId("snooze-option-30m"));

  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("30m");
  expect(onClose).toHaveBeenCalled();
});
