import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/router";
import NotificationPanel from "./NotificationPanel";
import { useNotifications } from "../../hooks/useNotifications";

const mockCopy: Record<string, string> = {
  "notifications.title": "Notificaciones",
  "notifications.close": "Cerrar",
  "notifications.markAllRead": "Marcar todo como leído",
  "notifications.tabs.all": "Todo",
  "notifications.tabs.likes": "Likes",
  "notifications.tabs.chats": "Chats",
  "notifications.tabs.system": "Sistema",
  "notifications.empty.all": "Estás al día.",
  "notifications.empty.likes": "Sin likes por ahora.",
  "notifications.empty.chats": "Sin mensajes nuevos.",
  "notifications.empty.system": "Sin avisos.",
  "notifications.error": "No pudimos cargar tus notificaciones.",
  "notifications.retry": "Reintentar",
  "notifications.survey.title": "Preferencias CARE",
  "notifications.survey.pending_one":
    "Te falta 1 pregunta para completar tus preferencias.",
  "notifications.survey.pending_other":
    "Te faltan {{count}} preguntas para completar tus preferencias.",
  "notifications.actor.fallback": "Alguien",
  "notifications.like.single": "A {{name}} le gustas",
  "notifications.like.superlike": "{{name}} te envió un Super Like",
  "notifications.match.single": "¡Es un match con {{name}}!",
  "notifications.message.single": "Nuevo mensaje de {{name}}",
  "notifications.system.fallback": "Red Thread",
};

function mockTranslate(key: string, options?: Record<string, unknown>) {
  let value = mockCopy[key] ?? key;
  if (options && typeof options === "object") {
    Object.entries(options).forEach(([name, replacement]) => {
      value = value.replace(
        new RegExp(`{{${name}}}`, "g"),
        String(replacement),
      );
    });
  }
  return value;
}

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: mockTranslate,
    i18n: { language: "es" },
  }),
}));

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => false,
}));

jest.mock("../../hooks/useNotifications", () => ({
  useNotifications: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseNotifications = useNotifications as jest.Mock;

const zeroCounts = {
  count: 0,
  all: 0,
  social: 0,
  messages: 0,
  system: 0,
  survey_pending: 0,
};

const makeHook = (overrides: Record<string, unknown> = {}) => ({
  items: [],
  counts: zeroCounts,
  unreadCount: 0,
  loading: false,
  error: false,
  nextCursor: null,
  refresh: jest.fn(),
  markRead: jest.fn(),
  markBucket: jest.fn(),
  markAllRead: jest.fn(),
  ...overrides,
});

type Hook = ReturnType<typeof makeHook>;

let hook: Hook;
let push: jest.Mock;
let onClose: jest.Mock;

const renderPanel = () => render(<NotificationPanel onClose={onClose} />);

const useCounts = (partial: Partial<typeof zeroCounts>) => {
  hook = makeHook({ counts: { ...zeroCounts, ...partial } });
  mockedUseNotifications.mockImplementation(() => hook);
};

beforeEach(() => {
  jest.clearAllMocks();
  push = jest.fn();
  onClose = jest.fn();
  hook = makeHook();
  mockedUseRouter.mockReturnValue({ push });
  mockedUseNotifications.mockImplementation(() => hook);
});

describe("NotificationPanel", () => {
  it("renders the four tabs with their unread counts", () => {
    useCounts({
      count: 6,
      all: 6,
      social: 3,
      messages: 2,
      system: 1,
      survey_pending: 1,
    });
    renderPanel();

    expect(screen.getByTestId("notification-tab-all")).toHaveTextContent(
      "Todo",
    );
    expect(screen.getByTestId("notification-tab-likes")).toHaveTextContent(
      "Likes",
    );
    expect(screen.getByTestId("notification-tab-chats")).toHaveTextContent(
      "Chats",
    );
    expect(screen.getByTestId("notification-tab-system")).toHaveTextContent(
      "Sistema",
    );
    expect(screen.getByTestId("notification-tab-all")).toHaveTextContent("6");
    expect(screen.getByTestId("notification-tab-likes")).toHaveTextContent("3");
    expect(screen.getByTestId("notification-tab-chats")).toHaveTextContent("2");
    expect(screen.getByTestId("notification-tab-system")).toHaveTextContent(
      "1",
    );
  });

  it("requests chats with the unread flag", async () => {
    renderPanel();
    expect(mockedUseNotifications).toHaveBeenLastCalledWith("all", {
      unread: false,
    });

    fireEvent.click(screen.getByTestId("notification-tab-chats"));

    await waitFor(() =>
      expect(mockedUseNotifications).toHaveBeenLastCalledWith("messages", {
        unread: true,
      }),
    );
  });

  it("marks social seen once when Likes is opened", async () => {
    useCounts({ count: 3, all: 3, social: 2, messages: 1 });
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-tab-likes"));
    await waitFor(() => expect(hook.markBucket).toHaveBeenCalledWith("social"));

    fireEvent.click(screen.getByTestId("notification-tab-all"));
    fireEvent.click(screen.getByTestId("notification-tab-likes"));
    await waitFor(() => expect(screen.getByTestId("notification-tab-likes")));
    expect(hook.markBucket).toHaveBeenCalledTimes(1);
  });

  it("marks system seen once when Sistema is opened", async () => {
    useCounts({ count: 3, all: 3, system: 2, survey_pending: 1 });
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-tab-system"));

    await waitFor(() => expect(hook.markBucket).toHaveBeenCalledWith("system"));
    expect(hook.markBucket).toHaveBeenCalledTimes(1);
  });

  it("does not bulk-mark system when only the survey is pending", async () => {
    useCounts({ count: 1, all: 1, system: 1, survey_pending: 1 });
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-tab-system"));
    await screen.findByTestId("notification-survey-item");

    expect(hook.markBucket).not.toHaveBeenCalled();
  });

  it("pins the survey on Todo and Sistema, and navigates from it", async () => {
    useCounts({ count: 2, all: 2, system: 2, survey_pending: 2 });
    renderPanel();

    expect(
      await screen.findByTestId("notification-survey-item"),
    ).toHaveTextContent("Preferencias CARE");
    expect(screen.getByTestId("notification-survey-item")).toHaveTextContent(
      "Te faltan 2 preguntas",
    );

    fireEvent.click(screen.getByTestId("notification-tab-likes"));
    await waitFor(() =>
      expect(
        screen.queryByTestId("notification-survey-item"),
      ).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("notification-tab-system"));
    const survey = await screen.findByTestId("notification-survey-item");
    fireEvent.click(survey);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/home?encuesta=1");
  });

  it("shows the survey with singular copy for one pending question", async () => {
    useCounts({ count: 1, all: 1, system: 1, survey_pending: 1 });
    renderPanel();

    expect(
      await screen.findByTestId("notification-survey-item"),
    ).toHaveTextContent("Te falta 1 pregunta");
  });

  it("shows the per-tab empty state", async () => {
    renderPanel();
    expect(await screen.findByText("Estás al día.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("notification-tab-chats"));
    expect(await screen.findByText("Sin mensajes nuevos.")).toBeInTheDocument();
  });

  it("shows an error state and retries", async () => {
    hook = makeHook({ error: true });
    mockedUseNotifications.mockImplementation(() => hook);
    renderPanel();

    expect(
      await screen.findByText("No pudimos cargar tus notificaciones."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(hook.refresh).toHaveBeenCalledTimes(1);
  });

  it("closes the panel after clicking an item", async () => {
    hook = makeHook({
      items: [
        {
          id: "n1",
          type: "like",
          is_read: false,
          created_at: "2026-10-19T10:00:00Z",
          user: { name: "Ana", photo: null, nickname: "ana" },
          metadata: {},
        },
      ],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    renderPanel();

    fireEvent.click(await screen.findByTestId("notification-item-n1"));

    expect(hook.markRead).toHaveBeenCalledWith("n1");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/likes");
  });

  it("only offers mark-all-read in Sistema", async () => {
    useCounts({ count: 2, all: 2, system: 2 });
    renderPanel();

    expect(
      screen.queryByTestId("notification-mark-all"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("notification-tab-system"));
    fireEvent.click(await screen.findByTestId("notification-mark-all"));

    expect(hook.markAllRead).toHaveBeenCalledTimes(1);
  });
});
