import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/router";
import NotificationPanel from "./NotificationPanel";
import apiClient from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: "es" },
  }),
}));

jest.mock("next/router", () => ({ useRouter: jest.fn() }));

jest.mock("../../hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => false,
}));

jest.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: jest.fn(), closeSnackbar: jest.fn() }),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const backend: {
  paused_until: string | null;
  paused_from: string | null;
} = {
  paused_until: new Date(Date.now() + 15 * 60_000).toISOString(),
  paused_from: new Date(Date.now() - 60_000).toISOString(),
};

const counts = {
  count: 0,
  all: 0,
  social: 0,
  messages: 0,
  system: 0,
  survey_pending: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
  backend.paused_until = new Date(Date.now() + 15 * 60_000).toISOString();
  backend.paused_from = new Date(Date.now() - 60_000).toISOString();
  mockedUseRouter.mockReturnValue({
    query: {},
    asPath: "/home",
    push: jest.fn(),
    replace: jest.fn(),
    locale: "es",
  });
  mockGet.mockImplementation((url: string) =>
    url === "/notifications/unread-count"
      ? Promise.resolve({
          data: {
            ...counts,
            paused_until: backend.paused_until,
            dnd_active: Boolean(backend.paused_until),
          },
        })
      : Promise.resolve({ data: { items: [], next_cursor: null } }),
  );
  mockPost.mockResolvedValue({ data: {} });
  mockDelete.mockImplementation(async () => {
    backend.paused_until = null;
    backend.paused_from = null;
    return {
      data: { paused_until: null, dnd_active: false, paused_from: null },
    };
  });
});

it("desactiva el DND con un solo clic en Reanudar notificaciones", async () => {
  render(<NotificationPanel onClose={jest.fn()} />);

  await waitFor(() =>
    expect(
      screen.getByTestId("notification-pause-remaining"),
    ).toBeInTheDocument(),
  );

  fireEvent.click(screen.getByTestId("notification-pause"));
  fireEvent.click(screen.getByTestId("notification-pause-resume"));

  await waitFor(() =>
    expect(
      screen.queryByTestId("notification-pause-remaining"),
    ).not.toBeInTheDocument(),
  );
  expect(mockDelete).toHaveBeenCalledTimes(1);
  expect(mockDelete).toHaveBeenCalledWith("/notifications/pause");
});
