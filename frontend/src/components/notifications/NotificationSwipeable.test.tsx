import { fireEvent, render, screen } from "@testing-library/react";
import NotificationSwipeable from "./NotificationSwipeable";

const touchOn = (x: number, y: number) =>
  ({ touches: [{ clientX: x, clientY: y }] }) as unknown as TouchEventInit;

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
