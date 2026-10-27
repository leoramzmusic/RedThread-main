import { render } from "@testing-library/react";
import SettingsIcon from "@mui/icons-material/Settings";
import TranslateIcon from "@mui/icons-material/Translate";
import QuickActionIcon, { getBellBadgeSx } from "./QuickActionIcon";
import NotificationActionIcon from "./NotificationActionIcon";

const colorOf = (element: Element | null) => {
  if (!element) throw new Error("element not found");
  return window.getComputedStyle(element).color;
};

describe("premium notifications icon", () => {
  it("shares the family color with the settings and language icons", () => {
    const { container } = render(
      <>
        <QuickActionIcon styleId="premium" motion="gear">
          <SettingsIcon className="rt-settings-spin" />
        </QuickActionIcon>
        <QuickActionIcon styleId="premium" motion="globe">
          <TranslateIcon className="rt-globe" />
        </QuickActionIcon>
        <NotificationActionIcon styleId="premium" />
      </>,
    );

    const bell = container.querySelector(".rt-bell-icon");
    const gear = container.querySelector(".rt-settings-spin");
    const globe = container.querySelector(".rt-globe");

    expect(colorOf(bell)).toBe(colorOf(gear));
    expect(colorOf(bell)).toBe(colorOf(globe));
  });

  it("keeps the base color when there are pending notifications", () => {
    const { container: idle } = render(
      <NotificationActionIcon styleId="premium" unreadCount={0} />,
    );
    const { container: pending } = render(
      <NotificationActionIcon styleId="premium" unreadCount={3} />,
    );

    expect(colorOf(pending.querySelector(".rt-bell-icon"))).toBe(
      colorOf(idle.querySelector(".rt-bell-icon")),
    );
  });

  it("keeps the family color while the panel is open", () => {
    const { container } = render(
      <>
        <QuickActionIcon styleId="premium" motion="gear">
          <SettingsIcon className="rt-settings-spin" />
        </QuickActionIcon>
        <NotificationActionIcon styleId="premium" panelOpen unreadCount={0} />
      </>,
    );

    expect(colorOf(container.querySelector(".rt-bell-icon"))).toBe(
      colorOf(container.querySelector(".rt-settings-spin")),
    );
  });

  it("keeps a discreet badge without red halo competing with the circle", () => {
    const sx = getBellBadgeSx(true) as Record<string, unknown>;

    expect(String(sx.animation)).not.toContain("rtBadgeHalo");
    expect(String(sx.boxShadow)).not.toContain("230,57,70");
  });
});
