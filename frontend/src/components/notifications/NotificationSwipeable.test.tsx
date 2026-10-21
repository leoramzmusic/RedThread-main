import { fireEvent, render, screen } from "@testing-library/react";
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

it("archives on right swipe past threshold", () => {
  const onArchive = jest.fn();
  render(
    <NotificationSwipeable onArchive={onArchive} onDelete={jest.fn()}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent.touchStart(box, touchOn(0, 0));
  fireEvent.touchMove(box, touchOn(90, 0));
  fireEvent.touchEnd(box);
  expect(onArchive).toHaveBeenCalled();
});

it("deletes on left swipe past threshold", () => {
  const onDelete = jest.fn();
  render(
    <NotificationSwipeable onArchive={jest.fn()} onDelete={onDelete}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent.touchStart(box, touchOn(100, 0));
  fireEvent.touchMove(box, touchOn(10, 0));
  fireEvent.touchEnd(box);
  expect(onDelete).toHaveBeenCalled();
});

it("does nothing on an under-threshold swipe and suppresses the click", () => {
  const onArchive = jest.fn();
  const onDelete = jest.fn();
  const onClick = jest.fn();
  render(
    <NotificationSwipeable onArchive={onArchive} onDelete={onDelete}>
      <button onClick={onClick}>item</button>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent.touchStart(box, touchOn(0, 0));
  fireEvent.touchMove(box, touchOn(40, 0));
  fireEvent.touchEnd(box);

  expect(onArchive).not.toHaveBeenCalled();
  expect(onDelete).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "item" }));
  expect(onClick).not.toHaveBeenCalled();
});

it("locks to vertical scrolling without triggering an action", () => {
  const onArchive = jest.fn();
  const onDelete = jest.fn();
  render(
    <NotificationSwipeable onArchive={onArchive} onDelete={onDelete}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent.touchStart(box, touchOn(0, 0));
  fireEvent.touchMove(box, touchOn(10, 80));
  fireEvent.touchEnd(box);

  expect(onArchive).not.toHaveBeenCalled();
  expect(onDelete).not.toHaveBeenCalled();
});

it("archives on a right mouse drag", () => {
  const onArchive = jest.fn();
  render(
    <NotificationSwipeable onArchive={onArchive} onDelete={jest.fn()}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent(box, pointerOn("pointerdown", 0, 0));
  fireEvent(box, pointerOn("pointermove", 90, 0));
  fireEvent(box, pointerOn("pointerup", 90, 0));
  expect(onArchive).toHaveBeenCalled();
});

it("deletes on a left mouse drag", () => {
  const onDelete = jest.fn();
  render(
    <NotificationSwipeable onArchive={jest.fn()} onDelete={onDelete}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent(box, pointerOn("pointerdown", 100, 0));
  fireEvent(box, pointerOn("pointermove", 10, 0));
  fireEvent(box, pointerOn("pointerup", 10, 0));
  expect(onDelete).toHaveBeenCalled();
});

it("keeps child clicks working and does not capture when pressing a button without dragging", () => {
  const onArchive = jest.fn();
  const onClick = jest.fn();
  render(
    <NotificationSwipeable onArchive={onArchive} onDelete={jest.fn()}>
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
  expect(onArchive).not.toHaveBeenCalled();
  expect(capture).not.toHaveBeenCalled();
});

it("captures the pointer only after horizontal movement and releases it on pointerup", () => {
  render(
    <NotificationSwipeable onArchive={jest.fn()} onDelete={jest.fn()}>
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
  const onArchive = jest.fn();
  render(
    <NotificationSwipeable onArchive={onArchive} onDelete={jest.fn()}>
      <button>child</button>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  const { capture } = definePointerCapture(box);
  const button = screen.getByRole("button", { name: "child" });

  fireEvent(button, pointerOn("pointerdown", 0, 0));
  fireEvent(button, pointerOn("pointermove", 30, 0));
  fireEvent(button, pointerOn("pointerup", 30, 0));

  expect(capture).not.toHaveBeenCalled();
  expect(onArchive).not.toHaveBeenCalled();
});

it("does not swallow the next click after a drag that ends without a click", () => {
  const onArchive = jest.fn();
  const onClick = jest.fn();
  render(
    <NotificationSwipeable onArchive={onArchive} onDelete={jest.fn()}>
      <button onClick={onClick}>child</button>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  const button = screen.getByRole("button", { name: "child" });

  fireEvent(box, pointerOn("pointerdown", 0, 0));
  fireEvent(box, pointerOn("pointermove", 90, 0));
  fireEvent(box, pointerOn("pointerup", 90, 0));
  expect(onArchive).toHaveBeenCalledTimes(1);

  fireEvent(button, pointerOn("pointerdown", 0, 0));
  fireEvent(button, pointerOn("pointerup", 0, 0));
  fireEvent.click(button);
  expect(onClick).toHaveBeenCalledTimes(1);
});

it("fires the action once when a touch gesture emits both pointer and touch events", () => {
  const onArchive = jest.fn();
  render(
    <NotificationSwipeable onArchive={onArchive} onDelete={jest.fn()}>
      <div>item</div>
    </NotificationSwipeable>,
  );
  const box = screen.getByTestId("notification-swipeable");
  fireEvent(box, pointerOn("pointerdown", 0, 0, "touch", 7));
  fireEvent.touchStart(box, touchOn(0, 0));
  fireEvent(box, pointerOn("pointermove", 90, 0, "touch", 7));
  fireEvent.touchMove(box, touchOn(90, 0));
  fireEvent(box, pointerOn("pointerup", 90, 0, "touch", 7));
  fireEvent.touchEnd(box);

  expect(onArchive).toHaveBeenCalledTimes(1);
});
