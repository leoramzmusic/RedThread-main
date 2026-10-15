import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import MusicSection from "./MusicSection";

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
    i18n: { language: "es" },
  }),
}));

jest.mock("../../../../context/ThemeContext", () => ({
  useAppTheme: () => ({ mode: "light" }),
}));

jest.mock("../../../../services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

jest.mock("../../../../services/spotifyService", () => ({}));

jest.mock("../SpotifySearchModal", () => {
  const MockSpotifySearchModal = () => null;
  return { __esModule: true, default: MockSpotifySearchModal };
});

jest.mock("../../MusicGenreSelector", () => {
  const MockMusicGenreSelector = () => <div data-testid="genre-selector" />;
  return { __esModule: true, default: MockMusicGenreSelector };
});

function Harness({
  showSpotify,
  showGenres = true,
}: {
  showSpotify: boolean;
  showGenres?: boolean;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { control, watch, setValue } = useForm<any>({
    defaultValues: { mi_himno: {}, music_genres: [] },
  });
  return (
    <MusicSection
      control={control}
      watch={watch}
      setValue={setValue}
      showSpotify={showSpotify}
      showGenres={showGenres}
    />
  );
}

const GENRES = /Géneros Musicales/i;

describe("MusicSection (genres panel vs Spotify toggle)", () => {
  it("expands Géneros Musicales by default when Spotify is disabled", () => {
    render(<Harness showSpotify={false} />);
    expect(screen.getByRole("button", { name: GENRES })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("keeps Géneros Musicales collapsed when Spotify is enabled", () => {
    render(<Harness showSpotify={true} />);
    expect(screen.getByRole("button", { name: GENRES })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });
});
