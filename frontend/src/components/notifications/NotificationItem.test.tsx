import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import NotificationItem from "./NotificationItem";

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.name ? `${key}:${options.name}` : key,
    i18n: { language: "en" },
  }),
}));

const base = {
  id: "n1",
  type: "like",
  metadata: {},
  actor_count: 1,
  is_read: false,
  created_at: new Date().toISOString(),
  user: { name: "Ana", photo: "/ana.jpg", nickname: "ana" },
  target_type: "likes",
};

describe("NotificationItem", () => {
  it("renders grouped like copy and thumbnail", () => {
    const { container } = render(
      <NotificationItem
        notification={{
          ...base,
          actor_count: 4,
          actors: [{ name: "Ana" }, { name: "Bea" }],
          metadata: { shown_media_thumbnail_url: "/m.jpg" },
        }}
        onRead={jest.fn()}
      />,
    );

    expect(screen.getByText(/notifications.like.group/)).toBeInTheDocument();
    expect(screen.getByTestId("notification-thumb")).toBeInTheDocument();
    expect(container.querySelector('img[src$="/ana.jpg"]')).toBeInTheDocument();
  });

  it("falls back to the actor avatar without a thumbnail", () => {
    render(<NotificationItem notification={base} onRead={jest.fn()} />);

    expect(screen.queryByTestId("notification-thumb")).not.toBeInTheDocument();
    expect(
      screen.getAllByText("notifications.like.single:Ana").length,
    ).toBeGreaterThan(0);
  });

  it("shows quick reply only when can_reply", () => {
    render(
      <NotificationItem
        notification={{
          ...base,
          type: "message",
          metadata: { can_reply: true, preview: "hola" },
          target_type: "chat",
        }}
        onRead={jest.fn()}
        onQuickReply={jest.fn()}
      />,
    );

    expect(screen.getByTestId("notification-quick-reply")).toBeInTheDocument();
  });

  it("hides quick reply when can_reply is absent", () => {
    render(
      <NotificationItem
        notification={{
          ...base,
          type: "message",
          target_type: "chat",
          metadata: {},
        }}
        onRead={jest.fn()}
      />,
    );

    expect(
      screen.queryByTestId("notification-quick-reply"),
    ).not.toBeInTheDocument();
  });

  it("sends the quick reply and clears the input without marking read", () => {
    const onRead = jest.fn();
    const onQuickReply = jest.fn();
    render(
      <NotificationItem
        notification={{
          ...base,
          type: "message",
          target_type: "chat",
          metadata: { can_reply: true },
        }}
        onRead={onRead}
        onQuickReply={onQuickReply}
      />,
    );

    const input = screen.getByRole("textbox");
    expect(
      screen.getByRole("button", { name: "notifications.quickReply.send" }),
    ).toBeDisabled();

    fireEvent.change(input, { target: { value: "hola" } });
    fireEvent.click(screen.getByTestId("notification-quick-reply"));
    expect(onRead).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "notifications.quickReply.send" }),
    );

    expect(onQuickReply).toHaveBeenCalledWith(expect.anything(), "hola");
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("marks a unread notification as read once and navigates", async () => {
    const onRead = jest.fn();
    const onNavigate = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={onRead}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(onRead).toHaveBeenCalledTimes(1);
    expect(onRead).toHaveBeenCalledWith("n1");
    await act(async () => {});
    expect(onNavigate).toHaveBeenCalledWith(base);
  });

  it("does not mark an already-read notification as read", async () => {
    const onRead = jest.fn();
    const onNavigate = jest.fn();
    render(
      <NotificationItem
        notification={{ ...base, is_read: true }}
        onRead={onRead}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(onRead).not.toHaveBeenCalled();
    await act(async () => {});
    expect(onNavigate).toHaveBeenCalledWith(expect.anything());
  });

  it("applies unread styling", () => {
    render(<NotificationItem notification={base} onRead={jest.fn()} />);

    expect(screen.getByTestId("notification-item-n1")).toHaveStyle({
      backgroundColor: "rgba(230,57,70,0.07)",
    });
  });

  it("shows the snooze trigger only when onSnooze is provided", () => {
    const { rerender } = render(
      <NotificationItem notification={base} onRead={jest.fn()} />,
    );
    expect(
      screen.queryByTestId("notification-snooze-trigger"),
    ).not.toBeInTheDocument();

    rerender(
      <NotificationItem
        notification={base}
        onRead={jest.fn()}
        onSnooze={jest.fn()}
      />,
    );
    expect(
      screen.getByTestId("notification-snooze-trigger"),
    ).toBeInTheDocument();
  });

  it("exposes desktop hover actions without marking read or navigating", async () => {
    const onRead = jest.fn();
    const onNavigate = jest.fn();
    const onArchive = jest.fn();
    const onDelete = jest.fn();
    const onSnooze = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={onRead}
        onNavigate={onNavigate}
        onArchive={onArchive}
        onDelete={onDelete}
        onSnooze={onSnooze}
      />,
    );

    const toolbar = screen.getByTestId("notification-hover-actions");
    expect(toolbar).toHaveStyle({ opacity: "0" });

    fireEvent.click(screen.getByTestId("notification-hover-archive"));
    expect(onArchive).toHaveBeenCalledWith("n1");

    fireEvent.click(screen.getByTestId("notification-hover-delete"));
    expect(onDelete).toHaveBeenCalledWith("n1");

    fireEvent.click(screen.getByTestId("notification-hover-snooze"));
    fireEvent.click(await screen.findByTestId("snooze-option-1h"));
    expect(onSnooze).toHaveBeenCalledWith("1h");

    expect(onRead).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("snoozes from the item menu without marking read or navigating", async () => {
    const onRead = jest.fn();
    const onNavigate = jest.fn();
    const onSnooze = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={onRead}
        onNavigate={onNavigate}
        onSnooze={onSnooze}
      />,
    );

    fireEvent.click(screen.getByTestId("notification-snooze-trigger"));
    fireEvent.click(await screen.findByTestId("snooze-option-1h"));

    expect(onSnooze).toHaveBeenCalledTimes(1);
    expect(onSnooze).toHaveBeenCalledWith("1h");
    expect(onRead).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByTestId("snooze-option-1h")).not.toBeInTheDocument(),
    );
  });

  it("enters selection after a 500ms pointer hold", () => {
    jest.useFakeTimers();
    const onLongPress = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={jest.fn()}
        onLongPress={onLongPress}
      />,
    );

    const item = screen.getByTestId("notification-item-n1");
    fireEvent.pointerDown(item, {
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
      button: 0,
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledWith("n1");
    jest.useRealTimers();
  });

  it("cancels the long press when the pointer moves or targets a control", () => {
    jest.useFakeTimers();
    const onLongPress = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={jest.fn()}
        onLongPress={onLongPress}
        onSnooze={jest.fn()}
      />,
    );

    const item = screen.getByTestId("notification-item-n1");
    fireEvent.touchStart(item, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    fireEvent.touchMove(item, {
      touches: [{ clientX: 40, clientY: 10 }],
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onLongPress).not.toHaveBeenCalled();

    fireEvent.pointerDown(screen.getByTestId("notification-snooze-trigger"), {
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
      button: 0,
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onLongPress).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
