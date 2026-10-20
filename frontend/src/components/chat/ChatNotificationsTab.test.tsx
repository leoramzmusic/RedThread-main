import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChatNotificationsTab from "./ChatNotificationsTab";
import apiClient from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "es" },
  }),
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

const notification = {
  id: "n1",
  type: "like",
  content: "A Ana le gustas",
  is_read: false,
  created_at: "2026-10-19T10:00:00Z",
  actor_count: 1,
  actors: [],
  target_type: null,
  target_id: null,
  metadata: {},
  user: { name: "Ana", photo: null, nickname: "ana" },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockImplementation((url: string) => {
    if (url === "/notifications/unread-count") {
      return Promise.resolve({ data: { count: 1 } });
    }
    return Promise.resolve({
      data: { items: [notification], next_cursor: null },
    });
  });
  mockPost.mockResolvedValue({ data: {} });
});

it("renders the notification item and reports the unread count", async () => {
  const onUnreadCountChange = jest.fn();

  render(<ChatNotificationsTab onUnreadCountChange={onUnreadCountChange} />);

  expect(await screen.findByTestId("notification-item-n1")).toBeInTheDocument();
  await waitFor(() => expect(onUnreadCountChange).toHaveBeenCalledWith(1));
});

it("marks the notification read when clicked", async () => {
  render(<ChatNotificationsTab />);

  fireEvent.click(await screen.findByTestId("notification-item-n1"));

  await waitFor(() =>
    expect(mockPost).toHaveBeenCalledWith("/notifications/n1/read"),
  );
});
