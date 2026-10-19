import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NotificationPanel from "./NotificationPanel";
import apiClient from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockGet = apiClient.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockImplementation((url: string) => {
    if (url === "/notifications/unread-count") {
      return Promise.resolve({ data: { count: 0 } });
    }
    return Promise.resolve({ data: [] });
  });
});

const renderPanel = (surveyPendingCount = 4) => {
  const onClose = jest.fn();
  const onUpdateUnreadCount = jest.fn();
  const onOpenSurvey = jest.fn();
  render(
    <NotificationPanel
      onClose={onClose}
      onUpdateUnreadCount={onUpdateUnreadCount}
      surveyPendingCount={surveyPendingCount}
      onOpenSurvey={onOpenSurvey}
    />,
  );
  return { onOpenSurvey };
};

describe("NotificationPanel", () => {
  it("shows the pending survey first in Todo and opens it", async () => {
    const { onOpenSurvey } = renderPanel();
    const item = await screen.findByTestId("notification-survey-item");
    expect(item).toHaveTextContent("Encuesta pendiente");
    expect(item).toHaveTextContent("Te faltan 4 preguntas");
    fireEvent.click(item);
    expect(onOpenSurvey).toHaveBeenCalledTimes(1);
  });

  it("shows the survey in Sistema but not in Matches", async () => {
    renderPanel(1);
    expect(
      await screen.findByTestId("notification-survey-item"),
    ).toHaveTextContent("Te falta 1 pregunta");
    fireEvent.click(screen.getByRole("tab", { name: "Matches" }));
    await waitFor(() =>
      expect(
        screen.queryByTestId("notification-survey-item"),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("tab", { name: "Sistema" }));
    expect(
      await screen.findByTestId("notification-survey-item"),
    ).toBeInTheDocument();
  });

  it("does not show the survey item without pending questions", async () => {
    renderPanel(0);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    expect(
      screen.queryByTestId("notification-survey-item"),
    ).not.toBeInTheDocument();
  });
});
