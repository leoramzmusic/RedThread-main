import { act, fireEvent, render, screen } from "@testing-library/react";
import NotificationSwipeable from "./NotificationSwipeable";

const touchOn = (x: number, y: number) =>
  ({ touches: [{ clientX: x, clientY: y }] }) as unknown as TouchEventInit;

const pointerOn = (
  type: string,
  x: number,
  y: number,
  pointerType = "mouse",
  pointerId = 1,
) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: y,
  });
  Object.defineProperty(event, "pointerId", { value: pointerId });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  return event;
};

const definePointerCapture = (element: HTMLElement) => {
  const capture = jest.fn();
  const release = jest.fn();
  Object.defineProperty(element, "setPointerCapture", {
    value: capture,
    configurable: true,
  });
  Object.defineProperty(element, "releasePointerCapture", {
    value: release,
    configurable: true,
  });
  return { capture, release };
};

const settleExit = () => act(() => jest.advanceTimersByTime(240));

const vibrate = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  vibrate.mockClear();
  Object.defineProperty(navigator, "vibrate", {
    value: vibrate,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  jest.useRealTimers();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

const swipeTouch = (box: HTMLElement, dx: number, dy = 0) => {
  fireEvent.touchStart(box, touchOn(0, 0));
  fireEvent.touchMove(box, touchOn(dx, dy));
  fireEvent.touchEnd(box);
};

it("dismisses on right swipe past threshold", () => {
  const onDismiss = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  swipeTouch(box, 130);
  expect(onDismiss).not.toHaveBeenCalled();
  settleExit();
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it("does not dismiss an under-threshold right swipe", () => {
  const onDismiss = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  swipeTouch(box, 100);
  settleExit();
  expect(onDismiss).not.toHaveBeenCalled();
});

it("dismisses forever on a long right swipe", () => {
  const onDismiss = jest.fn();
  const onDismissForever = jest.fn();
  render(
    <NotificationSwipeable
      onDismiss={onDismiss}
      onDismissForever={onDismissForever}
    >
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  swipeTouch(box, 250);
  settleExit();
  expect(onDismissForever).toHaveBeenCalledTimes(1);
  expect(onDismiss).not.toHaveBeenCalled();
});

it("falls back to dismiss on a long swipe when forever is unavailable", () => {
  const onDismiss = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  swipeTouch(box, 250);
  settleExit();
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it("opens snooze on left swipe past threshold", () => {
  const onSnooze = jest.fn();
  render(
    <NotificationSwipeable onSnooze={onSnooze}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  swipeTouch(box, -130);
  expect(onSnooze).toHaveBeenCalledWith(box);
});

it("does not open snooze on an under-threshold left swipe", () => {
  const onSnooze = jest.fn();
  render(
    <NotificationSwipeable onSnooze={onSnooze}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  swipeTouch(box, -100);
  expect(onSnooze).not.toHaveBeenCalled();
});

it("exposes direction and progress while dragging", () => {
  render(
    <NotificationSwipeable onDismiss={jest.fn()} onSnooze={jest.fn()}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent.touchStart(box, touchOn(0, 0));
  fireEvent.touchMove(box, touchOn(60, 0));

  expect(box).toHaveAttribute("data-direction", "right");
  expect(box).toHaveAttribute("data-progress", "0.50");
  expect(box).toHaveAttribute("data-armed", "false");
  expect(screen.getByTestId("notification-swipe-dismiss")).toHaveStyle({
    opacity: "0.5",
  });
  expect(screen.getByTestId("notification-swipe-snooze")).toHaveStyle({
    opacity: "0",
  });

  fireEvent.touchMove(box, touchOn(-60, 0));
  expect(box).toHaveAttribute("data-direction", "left");
  expect(screen.getByTestId("notification-swipe-snooze")).toHaveStyle({
    opacity: "0.5",
  });
  expect(screen.getByTestId("notification-swipe-dismiss")).toHaveStyle({
    opacity: "0",
  });
  fireEvent.touchEnd(box);
});

it("marks the action armed at the threshold and forever past the long threshold", () => {
  render(
    <NotificationSwipeable onDismiss={jest.fn()} onDismissForever={jest.fn()}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent.touchStart(box, touchOn(0, 0));
  fireEvent.touchMove(box, touchOn(120, 0));
  expect(box).toHaveAttribute("data-armed", "true");
  expect(box).toHaveAttribute("data-forever", "false");

  fireEvent.touchMove(box, touchOn(240, 0));
  expect(box).toHaveAttribute("data-forever", "true");
  expect(screen.getByTestId("notification-swipe-forever")).toHaveStyle({
    opacity: "1",
  });
  fireEvent.touchEnd(box);
});

it("fires haptics once when crossing the threshold on touch", () => {
  const onDismiss = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent.touchStart(box, touchOn(0, 0));
  fireEvent.touchMove(box, touchOn(100, 0));
  expect(vibrate).not.toHaveBeenCalled();
  fireEvent.touchMove(box, touchOn(130, 0));
  expect(vibrate).toHaveBeenCalledTimes(1);
  expect(vibrate).toHaveBeenCalledWith(12);
  fireEvent.touchMove(box, touchOn(180, 0));
  expect(vibrate).toHaveBeenCalledTimes(1);
  fireEvent.touchEnd(box);
});

it("does not fire haptics for mouse drags", () => {
  const onDismiss = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent(box, pointerOn("pointerdown", 0, 0));
  fireEvent(box, pointerOn("pointermove", 130, 0));
  expect(vibrate).not.toHaveBeenCalled();
  fireEvent(box, pointerOn("pointerup", 130, 0));
});

it("animates the exit before running the action", () => {
  const onDismiss = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  swipeTouch(box, 130);
  act(() => jest.advanceTimersByTime(100));
  expect(onDismiss).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(100));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it("runs the dismiss action after the 140ms micro exit", () => {
  const onDismiss = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  swipeTouch(box, 130);
  act(() => jest.advanceTimersByTime(139));
  expect(onDismiss).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(1));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it("runs the action immediately when reduced motion is requested", () => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
  const onDismiss = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  swipeTouch(screen.getByTestId("notification-swipeable"), 130);
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it("does nothing while disabled", () => {
  const onDismiss = jest.fn();
  const onSnooze = jest.fn();
  render(
    <NotificationSwipeable disabled onDismiss={onDismiss} onSnooze={onSnooze}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  swipeTouch(box, 130);
  swipeTouch(box, -130);
  settleExit();
  expect(onDismiss).not.toHaveBeenCalled();
  expect(onSnooze).not.toHaveBeenCalled();
});

it("suppresses the click after an under-threshold swipe", () => {
  const onDismiss = jest.fn();
  const onClick = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <button onClick={onClick}>item</button>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  swipeTouch(box, 40);

  fireEvent.click(screen.getByRole("button", { name: "item" }));
  expect(onClick).not.toHaveBeenCalled();
  settleExit();
  expect(onDismiss).not.toHaveBeenCalled();
});

it("locks to vertical scrolling without triggering an action", () => {
  const onDismiss = jest.fn();
  const onSnooze = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss} onSnooze={onSnooze}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  swipeTouch(box, 10, 80);
  settleExit();
  expect(onDismiss).not.toHaveBeenCalled();
  expect(onSnooze).not.toHaveBeenCalled();
});

it("dismisses on a right mouse drag", () => {
  const onDismiss = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent(box, pointerOn("pointerdown", 0, 0));
  fireEvent(box, pointerOn("pointermove", 130, 0));
  fireEvent(box, pointerOn("pointerup", 130, 0));
  settleExit();
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it("opens snooze on a left mouse drag", () => {
  const onSnooze = jest.fn();
  render(
    <NotificationSwipeable onSnooze={onSnooze}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent(box, pointerOn("pointerdown", 100, 0));
  fireEvent(box, pointerOn("pointermove", -30, 0));
  fireEvent(box, pointerOn("pointerup", -30, 0));
  expect(onSnooze).toHaveBeenCalledWith(box);
});

it("keeps child clicks working and does not capture when pressing a button without dragging", () => {
  const onDismiss = jest.fn();
  const onClick = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <button onClick={onClick}>child</button>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  const { capture } = definePointerCapture(box);
  const button = screen.getByRole("button", { name: "child" });

  fireEvent(button, pointerOn("pointerdown", 0, 0));
  expect(capture).not.toHaveBeenCalled();
  fireEvent(button, pointerOn("pointerup", 0, 0));
  fireEvent.click(button);

  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onDismiss).not.toHaveBeenCalled();
  expect(capture).not.toHaveBeenCalled();
});

it("captures the pointer only after horizontal movement and releases it on pointerup", () => {
  render(
    <NotificationSwipeable onDismiss={jest.fn()}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  const { capture, release } = definePointerCapture(box);

  fireEvent(box, pointerOn("pointerdown", 0, 0));
  expect(capture).not.toHaveBeenCalled();

  fireEvent(box, pointerOn("pointermove", 30, 0));
  expect(capture).toHaveBeenCalledWith(1);

  fireEvent(box, pointerOn("pointerup", 30, 0));
  expect(release).toHaveBeenCalledWith(1);
});

it("does not capture the pointer when the drag starts on an interactive child", () => {
  const onDismiss = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <button>child</button>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  const { capture } = definePointerCapture(box);
  const button = screen.getByRole("button", { name: "child" });

  fireEvent(button, pointerOn("pointerdown", 0, 0));
  fireEvent(button, pointerOn("pointermove", 130, 0));
  fireEvent(button, pointerOn("pointerup", 130, 0));

  expect(capture).not.toHaveBeenCalled();
  expect(onDismiss).not.toHaveBeenCalled();
});

it("does not swallow the next click after a drag that ends without a click", () => {
  const onDismiss = jest.fn();
  const onClick = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <button onClick={onClick}>child</button>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  const button = screen.getByRole("button", { name: "child" });

  fireEvent(box, pointerOn("pointerdown", 0, 0));
  fireEvent(box, pointerOn("pointermove", 130, 0));
  fireEvent(box, pointerOn("pointerup", 130, 0));
  settleExit();
  expect(onDismiss).toHaveBeenCalledTimes(1);

  fireEvent(button, pointerOn("pointerdown", 0, 0));
  fireEvent(button, pointerOn("pointerup", 0, 0));
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
});

it("fires the action once when a touch gesture emits both pointer and touch events", () => {
  const onDismiss = jest.fn();
  render(
    <NotificationSwipeable onDismiss={onDismiss}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent(box, pointerOn("pointerdown", 0, 0, "touch", 7));
  fireEvent.touchStart(box, touchOn(0, 0));
  fireEvent(box, pointerOn("pointermove", 130, 0, "touch", 7));
  fireEvent.touchMove(box, touchOn(130, 0));
  fireEvent(box, pointerOn("pointerup", 130, 0, "touch", 7));
  fireEvent.touchEnd(box);

  settleExit();
  expect(onDismiss).toHaveBeenCalledTimes(1);
});
