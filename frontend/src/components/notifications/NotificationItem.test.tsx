import { fireEvent, render, screen } from "@testing-library/react";
import { useRouter } from "next/router";
import NotificationItem from "./NotificationItem";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;

const baseNotification = {
  id: "n1",
  type: "like",
  content: "A Ana le gustó tu foto",
  is_read: false,
  created_at: "2026-10-19T10:00:00Z",
  actor_count: 1,
  actors: [{ name: "Ana", nickname: "ana" }],
  user: { name: "Ana", photo: "/ana.jpg" },
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

  it("renders the liked media thumbnail", () => {
    const { container } = render(
      <NotificationItem notification={baseNotification} onRead={jest.fn()} />,
    );

    expect(
      container.querySelector('img[src$="/thumb.jpg"]'),
    ).toBeInTheDocument();
  });

  it("marks read and opens likes for a grouped like", () => {
    const onRead = jest.fn();
    render(
      <NotificationItem
        notification={{
          ...baseNotification,
          actor_count: 3,
          content: "A Luis le gustó tu foto",
        }}
        onRead={onRead}
      />,
    );

    fireEvent.click(screen.getByText("A 3 personas les gustó tu foto"));

    expect(onRead).toHaveBeenCalledWith("n1");
    expect(push).toHaveBeenCalledWith("/likes");
  });

  it("navigates to the actor profile for a single like", () => {
    const onRead = jest.fn();
    render(
      <NotificationItem notification={baseNotification} onRead={onRead} />,
    );

    fireEvent.click(screen.getByText("A Ana le gustó tu foto"));

    expect(onRead).toHaveBeenCalledWith("n1");
    expect(push).toHaveBeenCalledWith("/profile/ana");
  });
});
