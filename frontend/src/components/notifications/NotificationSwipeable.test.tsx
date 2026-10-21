import { fireEvent, render, screen } from "@testing-library/react";
import NotificationSwipeable from "./NotificationSwipeable";

const touchOn = (x: number, y: number) =>
  ({ touches: [{ clientX: x, clientY: y }] }) as unknown as TouchEventInit;

const pointerOn = (type: string, x: number, y: number) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: y,
  });
  Object.defineProperty(event, "pointerId", { value: 1 });
  Object.defineProperty(event, "pointerType", { value: "mouse" });
  return event;
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
