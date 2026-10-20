import { fireEvent, render, screen } from "@testing-library/react";
import ProfileMediaCarousel from "./ProfileMediaCarousel";
import { MediaItem, MediaType } from "../../../types/media";

const photos: MediaItem[] = [
  {
    _id: "m1",
    user_id: "u1",
    type: MediaType.PHOTO,
    url: "/first.jpg",
    order_index: 0,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    _id: "m2",
    user_id: "u1",
    type: MediaType.PHOTO,
    url: "/second.jpg",
    order_index: 1,
    created_at: "2026-01-01T00:00:00Z",
  },
];

describe("ProfileMediaCarousel", () => {
  it("renders the active photo and requests the next index", () => {
    const onIndexChange = jest.fn();
    const { container, rerender } = render(
      <ProfileMediaCarousel
        mediaItems={photos}
        activeIndex={0}
        onIndexChange={onIndexChange}
      />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "http://localhost:8000/first.jpg",
    );

    fireEvent.click(screen.getByLabelText("Media siguiente"));
    expect(onIndexChange).toHaveBeenCalledWith(1);

    rerender(
      <ProfileMediaCarousel
        mediaItems={photos}
        activeIndex={1}
        onIndexChange={onIndexChange}
      />,
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "http://localhost:8000/second.jpg",
    );
  });

  it("uses fallback photos when there are no media items", () => {
    const { container } = render(
      <ProfileMediaCarousel
        fallbackPhotos={["/legacy.jpg"]}
        activeIndex={0}
        onIndexChange={jest.fn()}
      />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "http://localhost:8000/legacy.jpg",
    );
  });
});
