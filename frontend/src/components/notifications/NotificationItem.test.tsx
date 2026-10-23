import { act, fireEvent, render, screen, within } from "@testing-library/react";
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

afterEach(() => {
  jest.useRealTimers();
});

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

  it("shows the pin indicator only for pinned notifications", () => {
    const { rerender } = render(
      <NotificationItem notification={base} onRead={jest.fn()} />,
    );
    expect(screen.queryByTestId("notification-pinned")).not.toBeInTheDocument();

    rerender(
      <NotificationItem
        notification={{ ...base, pinned_at: new Date().toISOString() }}
        onRead={jest.fn()}
      />,
    );
    expect(screen.getByTestId("notification-pinned")).toBeInTheDocument();
  });

  it("marks the raised and dimmed states", () => {
    render(
      <NotificationItem notification={base} onRead={jest.fn()} raised dimmed />,
    );
    const item = screen.getByTestId("notification-item-n1");
    expect(item).toHaveAttribute("data-raised", "true");
    expect(item).toHaveAttribute("data-dimmed", "true");
  });

  it("shows the actions trigger only when onOpenActions is provided", () => {
    const { rerender } = render(
      <NotificationItem notification={base} onRead={jest.fn()} />,
    );
    expect(
      screen.queryByTestId("notification-actions-trigger"),
    ).not.toBeInTheDocument();

    rerender(
      <NotificationItem
        notification={base}
        onRead={jest.fn()}
        onOpenActions={jest.fn()}
      />,
    );
    expect(
      screen.getByTestId("notification-actions-trigger"),
    ).toBeInTheDocument();
  });

  it("opens the action menu from the overflow trigger without marking read or navigating", () => {
    const onRead = jest.fn();
    const onNavigate = jest.fn();
    const onOpenActions = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={onRead}
        onNavigate={onNavigate}
        onOpenActions={onOpenActions}
      />,
    );

    const trigger = screen.getByTestId("notification-actions-trigger");
    fireEvent.click(trigger);

    expect(onOpenActions).toHaveBeenCalledWith("n1", trigger);
    expect(onRead).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("exposes one quick mark-read action for an unread social item", () => {
    const onRead = jest.fn();
    const onNavigate = jest.fn();
    const onArchive = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={onRead}
        onNavigate={onNavigate}
        onArchive={onArchive}
      />,
    );

    const toolbar = screen.getByTestId("notification-hover-actions");
    expect(toolbar).toHaveStyle({ opacity: "0" });
    expect(within(toolbar).getAllByRole("button")).toHaveLength(1);

    const quick = screen.getByTestId("notification-quick-action");
    expect(quick).toHaveAttribute("data-action", "markRead");
    expect(
      screen.queryByTestId("notification-hover-snooze"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("notification-hover-delete"),
    ).not.toBeInTheDocument();

    fireEvent.click(quick);
    expect(onRead).toHaveBeenCalledWith("n1");
    expect(onArchive).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("uses the single quick action to archive a read social item", () => {
    const onRead = jest.fn();
    const onArchive = jest.fn();
    render(
      <NotificationItem
        notification={{ ...base, is_read: true }}
        onRead={onRead}
        onArchive={onArchive}
      />,
    );

    const quick = screen.getByTestId("notification-quick-action");
    expect(quick).toHaveAttribute("data-action", "archive");

    fireEvent.click(quick);
    expect(onArchive).toHaveBeenCalledWith("n1");
    expect(onRead).not.toHaveBeenCalled();
  });

  it("applies sparse, standard and dense density metrics", () => {
    const { rerender } = render(
      <NotificationItem
        notification={base}
        density="sparse"
        onRead={jest.fn()}
      />,
    );
    expect(screen.getByTestId("notification-item-n1")).toHaveAttribute(
      "data-density",
      "sparse",
    );
    expect(screen.getByTestId("notification-leading")).toHaveAttribute(
      "data-size",
      "52",
    );

    rerender(
      <NotificationItem
        notification={base}
        density="standard"
        onRead={jest.fn()}
      />,
    );
    expect(screen.getByTestId("notification-leading")).toHaveAttribute(
      "data-size",
      "48",
    );

    rerender(
      <NotificationItem
        notification={base}
        density="dense"
        onRead={jest.fn()}
      />,
    );
    expect(screen.getByTestId("notification-leading")).toHaveAttribute(
      "data-size",
      "40",
    );
  });

  it("exposes priority as data and a screen-reader label", () => {
    const { rerender } = render(
      <NotificationItem notification={base} onRead={jest.fn()} />,
    );
    expect(screen.getByTestId("notification-item-n1")).toHaveAttribute(
      "data-priority",
      "P2",
    );
    expect(
      screen.getByText("notifications.priority.informational"),
    ).toBeInTheDocument();

    rerender(
      <NotificationItem
        notification={{ ...base, metadata: { important: true } }}
        onRead={jest.fn()}
      />,
    );
    expect(screen.getByTestId("notification-item-n1")).toHaveAttribute(
      "data-priority",
      "P0",
    );
    expect(
      screen.getByText("notifications.priority.critical"),
    ).toBeInTheDocument();

    rerender(
      <NotificationItem
        notification={{ ...base, type: "message", target_type: "chat" }}
        onRead={jest.fn()}
      />,
    );
    expect(screen.getByTestId("notification-item-n1")).toHaveAttribute(
      "data-priority",
      "P1",
    );
    expect(screen.getByTestId("notification-priority-badge")).toHaveTextContent(
      "notifications.priority.actionRequiredShort",
    );
  });

  it("uses a system icon when there is no actor identity or thumbnail", () => {
    render(
      <NotificationItem
        notification={{
          ...base,
          type: "system",
          user: undefined,
          actors: [],
          metadata: {},
        }}
        onRead={jest.fn()}
      />,
    );

    expect(screen.getByTestId("notification-system-icon")).toHaveAttribute(
      "data-icon",
      "system",
    );
    expect(screen.queryByTestId("notification-thumb")).not.toBeInTheDocument();
  });

  it("hides the quick action in archived and trash views", () => {
    const { rerender } = render(
      <NotificationItem
        notification={base}
        variant="archived"
        onRead={jest.fn()}
        onArchive={jest.fn()}
      />,
    );
    expect(
      screen.queryByTestId("notification-hover-actions"),
    ).not.toBeInTheDocument();

    rerender(
      <NotificationItem
        notification={base}
        variant="trash"
        onRead={jest.fn()}
        onArchive={jest.fn()}
      />,
    );
    expect(
      screen.queryByTestId("notification-hover-actions"),
    ).not.toBeInTheDocument();
  });

  it("opens the action menu after a 500ms pointer hold", () => {
    jest.useFakeTimers();
    const onOpenActions = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={jest.fn()}
        onOpenActions={onOpenActions}
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
      jest.advanceTimersByTime(499);
    });
    expect(onOpenActions).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onOpenActions).toHaveBeenCalledWith("n1", item);
  });

  it("allows a 12px move but cancels once movement exceeds 12px", () => {
    jest.useFakeTimers();
    const onOpenActions = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={jest.fn()}
        onOpenActions={onOpenActions}
      />,
    );
    const item = screen.getByTestId("notification-item-n1");

    fireEvent.touchStart(item, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    fireEvent.touchMove(item, {
      touches: [{ clientX: 22, clientY: 10 }],
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onOpenActions).toHaveBeenCalledTimes(1);

    onOpenActions.mockClear();
    fireEvent.touchStart(item, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    fireEvent.touchMove(item, {
      touches: [{ clientX: 23, clientY: 10 }],
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onOpenActions).not.toHaveBeenCalled();
  });

  it("cancels the long press on vertical movement and interactive controls", () => {
    jest.useFakeTimers();
    const onOpenActions = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={jest.fn()}
        onOpenActions={onOpenActions}
      />,
    );

    const item = screen.getByTestId("notification-item-n1");
    fireEvent.touchStart(item, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    fireEvent.touchMove(item, {
      touches: [{ clientX: 10, clientY: 30 }],
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onOpenActions).not.toHaveBeenCalled();

    fireEvent.pointerDown(screen.getByTestId("notification-actions-trigger"), {
      pointerType: "mouse",
      clientX: 10,
      clientY: 10,
      button: 0,
    });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onOpenActions).not.toHaveBeenCalled();
  });

  it("opens the action menu on desktop right click", () => {
    const onOpenActions = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={jest.fn()}
        onOpenActions={onOpenActions}
      />,
    );
    const item = screen.getByTestId("notification-item-n1");
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });

    fireEvent(item, event);

    expect(event.defaultPrevented).toBe(true);
    expect(onOpenActions).toHaveBeenCalledWith("n1", item);
  });

  it("does not open actions on right click in selection mode", () => {
    const onOpenActions = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={jest.fn()}
        onOpenActions={onOpenActions}
        selectionMode
        onToggleSelect={jest.fn()}
      />,
    );
    const item = screen.getByTestId("notification-item-n1");
    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
    });

    fireEvent(item, event);

    expect(event.defaultPrevented).toBe(false);
    expect(onOpenActions).not.toHaveBeenCalled();
  });

  it("toggles selection when clicked in selection mode", () => {
    const onToggleSelect = jest.fn();
    const onRead = jest.fn();
    const onNavigate = jest.fn();
    render(
      <NotificationItem
        notification={base}
        onRead={onRead}
        onNavigate={onNavigate}
        selectionMode
        onToggleSelect={onToggleSelect}
      />,
    );

    fireEvent.click(screen.getByTestId("notification-item-n1"));

    expect(onToggleSelect).toHaveBeenCalledWith("n1");
    expect(onRead).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
