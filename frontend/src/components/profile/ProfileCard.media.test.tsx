import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProfileCard from "./ProfileCard";
import apiClient from "../../services/api";
import { MediaType } from "../../types/media";

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock("../../context/ThemeContext", () => ({
  useAppTheme: () => ({ mode: "dark" }),
}));

jest.mock("../../services/smartPhotos", () => ({
  useSmartPhotosTracking: () => ({
    handlePhotoClick: jest.fn(),
    handleMatch: jest.fn(),
  }),
}));

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

const profile = {
  user_id: "u1",
  display_name: "Ana",
  age: 28,
  bio: "",
  photos: ["/fallback.jpg"],
  interests: [],
  affinity_score: 80,
};

const media = {
  _id: "m1",
  user_id: "u1",
  type: MediaType.PHOTO,
  url: "/first.jpg",
  order_index: 0,
  created_at: "2026-01-01T00:00:00Z",
};

describe("ProfileCard media attribution", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockResolvedValue({ data: [media] } as never);
  });

  it("passes the active media item to onLike", async () => {
    const onLike = jest.fn();
    render(<ProfileCard profile={profile} onLike={onLike} />);

    await waitFor(() => expect(mockedGet).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        document.querySelector('[data-media-id="m1"]'),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Me gusta" }));

    expect(onLike).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "m1", url: "/first.jpg" }),
    );
  });
});
