import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/router";
import NotificationItem from "./NotificationItem";

const mockCopy: Record<string, string> = {
  "notifications.actor.fallback": "Alguien",
  "notifications.like.single": "A {{name}} le gustas",
  "notifications.like.superlike": "{{name}} te envió un Super Like",
  "notifications.match.single": "¡Es un match con {{name}}!",
  "notifications.message.single": "Nuevo mensaje de {{name}}",
  "notifications.system.fallback": "Red Thread",
};

function mockTranslate(key: string, options?: Record<string, unknown>) {
  let value = mockCopy[key] ?? key;
  if (options && typeof options === "object") {
    Object.entries(options).forEach(([name, replacement]) => {
      value = value.replace(
        new RegExp(`{{${name}}}`, "g"),
        String(replacement),
      );
    });
  }
  return value;
}

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: mockTranslate,
    i18n: { language: "es" },
  }),
}));

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;

const baseNotification = {
  id: "n1",
  type: "like",
  content: "A 3 personas les gustó tu foto",
  is_read: false,
  created_at: "2026-10-19T10:00:00Z",
  actor_count: 1,
  actors: [{ name: "Ana", nickname: "ana" }],
  user: { name: "Ana", photo: "/ana.jpg", nickname: "ana" },
  target_type: "profile",
  target_id: "u-ana",
  metadata: {
    shown_media_id: "m1",
    shown_media_url: "/photo.jpg",
    shown_media_thumbnail_url: "/thumb.jpg",
    shown_media_type: "photo",
    target_url: "/profile/ana",
  },
};

describe("NotificationItem", () => {
  const push = jest.fn();

  beforeEach(() => {
    push.mockReset();
    mockedUseRouter.mockReturnValue({ push });
  });

  it("renders the testid and the liked media thumbnail", () => {
    const { container } = render(
      <NotificationItem notification={baseNotification} onRead={jest.fn()} />,
    );

    expect(screen.getByTestId("notification-item-n1")).toBeInTheDocument();
    expect(
      container.querySelector('img[src$="/thumb.jpg"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('img[src$="/ana.jpg"]')).toBeInTheDocument();
  });

  it("uses the like copy and opens likes for a single like", () => {
    const onRead = jest.fn();
    render(
      <NotificationItem notification={baseNotification} onRead={onRead} />,
    );

    expect(screen.getByTestId("notification-item-n1")).toHaveTextContent(
      "A Ana le gustas",
    );
    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(onRead).toHaveBeenCalledWith("n1");
    expect(push).toHaveBeenCalledWith("/likes");
  });

  it("shows the last actor in singular and opens likes for a grouped like", () => {
    const onRead = jest.fn();
    render(
      <NotificationItem
        notification={{
          ...baseNotification,
          actor_count: 3,
          actors: [
            { name: "Ana", nickname: "ana" },
            { name: "Luis", nickname: "luis" },
          ],
          user: { name: "Luis", photo: null, nickname: "luis" },
        }}
        onRead={onRead}
      />,
    );

    expect(screen.getByTestId("notification-item-n1")).toHaveTextContent(
      "A Luis le gustas",
    );
    expect(screen.queryByText(/3 personas/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(onRead).toHaveBeenCalledWith("n1");
    expect(push).toHaveBeenCalledWith("/likes");
  });

  it("uses the match copy and opens the match conversation", () => {
    const onRead = jest.fn();
    render(
      <NotificationItem
        notification={{
          ...baseNotification,
          type: "match",
          content: "Contenido crudo del backend",
          target_type: "chat",
          target_id: "c9",
          metadata: {},
        }}
        onRead={onRead}
      />,
    );

    expect(screen.getByTestId("notification-item-n1")).toHaveTextContent(
      "¡Es un match con Ana!",
    );
    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(onRead).toHaveBeenCalledWith("n1");
    expect(push).toHaveBeenCalledWith("/chat?conversation=c9");
  });

  it("opens the profile for a match without a conversation", () => {
    render(
      <NotificationItem
        notification={{
          ...baseNotification,
          type: "match",
          target_type: "profile",
          target_id: "u-ana",
          metadata: {},
        }}
        onRead={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(push).toHaveBeenCalledWith("/profile/ana");
  });

  it("uses the message preview and opens the conversation", () => {
    render(
      <NotificationItem
        notification={{
          ...baseNotification,
          type: "message",
          target_type: "chat",
          target_id: "c9",
          metadata: { preview: "Hola guapa", conversation_id: "c9" },
        }}
        onRead={jest.fn()}
      />,
    );

    expect(screen.getByTestId("notification-item-n1")).toHaveTextContent(
      "Hola guapa",
    );
    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(push).toHaveBeenCalledWith("/chat?conversation=c9");
  });

  it("falls back to the message copy without a preview", () => {
    render(
      <NotificationItem
        notification={{
          ...baseNotification,
          type: "message",
          target_type: "chat",
          target_id: "c9",
          metadata: {},
        }}
        onRead={jest.fn()}
      />,
    );

    expect(screen.getByTestId("notification-item-n1")).toHaveTextContent(
      "Nuevo mensaje de Ana",
    );
  });

  it("navigates a system notification to its URL", () => {
    const onRead = jest.fn();
    render(
      <NotificationItem
        notification={{
          ...baseNotification,
          type: "system",
          content: "Encuesta pendiente",
          target_type: "url",
          target_id: "/home?encuesta=1",
          metadata: {},
        }}
        onRead={onRead}
      />,
    );

    expect(screen.getByTestId("notification-item-n1")).toHaveTextContent(
      "Encuesta pendiente",
    );
    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(onRead).toHaveBeenCalledWith("n1");
    expect(push).toHaveBeenCalledWith("/home?encuesta=1");
  });

  it("uses metadata.target_url when there is no target id", () => {
    render(
      <NotificationItem
        notification={{
          ...baseNotification,
          type: "promo",
          content: "Promo",
          target_type: "url",
          target_id: null,
          metadata: { target_url: "/promo" },
        }}
        onRead={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(push).toHaveBeenCalledWith("/promo");
  });

  it("only marks read for a legacy notification without a destination", () => {
    const onRead = jest.fn();
    const onNavigate = jest.fn();
    render(
      <NotificationItem
        notification={{
          ...baseNotification,
          type: "reward",
          content: "Ganaste una recompensa",
          target_type: null,
          target_id: null,
          metadata: {},
        }}
        onRead={onRead}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(onRead).toHaveBeenCalledWith("n1");
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("does not mark an already-read notification as read", () => {
    const onRead = jest.fn();
    render(
      <NotificationItem
        notification={{ ...baseNotification, is_read: true }}
        onRead={onRead}
      />,
    );

    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(onRead).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/likes");
  });
});
