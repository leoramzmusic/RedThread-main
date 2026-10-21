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

it("selects the always duration", () => {
  const onSelect = jest.fn();
  const { onClose } = renderMenu(onSelect);

  fireEvent.click(screen.getByTestId("snooze-option-always"));

  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith("always");
  expect(onClose).toHaveBeenCalled();
});
