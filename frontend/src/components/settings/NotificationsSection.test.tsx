import { fireEvent, render, screen } from "@testing-library/react";
import NotificationsSection from "./NotificationsSection";

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "es" },
  }),
}));

describe("NotificationsSection mute toggles", () => {
  it("merges the toggled key over the defaults and emits the full object", () => {
    const onSettingsChange = jest.fn();

    render(
      <NotificationsSection
        settings={{
          notifications_enabled: true,
          notification_mutes: { social: false },
        }}
        onSettingsChange={onSettingsChange}
      />,
    );

    fireEvent.click(screen.getByTestId("mute-messages"));

    expect(onSettingsChange).toHaveBeenCalledTimes(1);
    expect(onSettingsChange).toHaveBeenCalledWith("notification_mutes", {
      social: false,
      messages: true,
      system: false,
      promos: false,
    });
  });
});
