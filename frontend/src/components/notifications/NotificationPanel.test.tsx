import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useRouter } from "next/router";
import NotificationPanel from "./NotificationPanel";
import { useNotifications } from "../../hooks/useNotifications";
import apiClient from "../../services/api";

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const mockCopy: Record<string, string> = {
  "notifications.title": "Notificaciones",
  "notifications.close": "Cerrar",
  "notifications.markAllRead": "Marcar todas como leídas",
  "notifications.readAll": "Leer todas",
  "notifications.selectMode": "Seleccionar notificaciones",
  "notifications.menu": "Más opciones",
  "notifications.archived.title": "Archivadas",
  "notifications.archived.back": "Volver",
  "notifications.trash.title": "Papelera",
  "notifications.bulk.selected": "{{count}} seleccionadas",
  "notifications.bulk.selectAll": "Seleccionar todas",
  "notifications.bulk.markRead": "Marcar como leídas",
  "notifications.bulk.archive": "Archivar",
  "notifications.bulk.delete": "Borrar",
  "notifications.bulk.restore": "Restaurar",
  "notifications.bulk.cancel": "Cancelar selección",
  "notifications.settings.title": "Ajustes",
  "notifications.actions.unarchive": "Restaurar",
  "notifications.actions.delete": "Borrar",
  "notifications.tabs.all": "Todo",
  "notifications.tabs.likes": "Likes",
  "notifications.tabs.chats": "Chats",
  "notifications.tabs.system": "Sistema",
  "notifications.empty.all": "Estás al día.",
  "notifications.empty.likes": "Sin likes por ahora.",
  "notifications.empty.chats": "Sin mensajes nuevos.",
  "notifications.empty.system": "Sin avisos.",
  "notifications.empty.archived": "Nada archivado.",
  "notifications.empty.trash": "La papelera está vacía.",
  "notifications.error": "No pudimos cargar tus notificaciones.",
  "notifications.retry": "Reintentar",
  "notifications.survey.title": "Preferencias CARE",
  "notifications.survey.pending_one":
    "Te falta {{count}} pregunta para completar tus preferencias.",
  "notifications.survey.pending_other":
    "Te faltan {{count}} preguntas para completar tus preferencias.",
  "notifications.actor.fallback": "Alguien",
  "notifications.like.single": "A {{name}} le gustas",
  "notifications.like.superlike": "{{name}} te envió un Super Like",
  "notifications.match.single": "¡Es un match con {{name}}!",
  "notifications.message.single": "Nuevo mensaje de {{name}}",
  "notifications.system.fallback": "Red Thread",
  "notifications.actions.undo": "Deshacer",
  "notifications.snooze.title": "Posponer notificaciones",
  "notifications.snooze.15m": "15 minutos",
  "notifications.snooze.30m": "30 minutos",
  "notifications.snooze.1h": "1 hora",
  "notifications.snooze.4h": "4 horas",
  "notifications.snooze.1d": "Mañana",
  "notifications.pause.title": "Pausar notificaciones",
  "notifications.pause.active":
    "Notificaciones pausadas: {{remaining}} · hasta las {{time}}",
  "notifications.pause.resume": "Reanudar notificaciones",
  "notifications.pause.tomorrow": "Hasta mañana",
  "notifications.pause.custom": "Personalizado",
  "notifications.pause.mode.single": "Pausa única",
  "notifications.pause.mode.recurring": "Recurrente",
  "notifications.pause.ruleName": "Nombre de la pausa",
  "notifications.pause.ruleNamePlaceholder": "Horario laboral",
  "notifications.pause.allow.title": "Permitir notificaciones prioritarias",
  "notifications.pause.allow.chats": "Chats directos",
  "notifications.pause.allow.system": "Mensajes del sistema",
  "notifications.pause.allow.likes": "Likes",
  "notifications.pause.allow.recommendations": "Recomendaciones",
  "notifications.pause.allow.comments": "Comentarios",
  "notifications.pause.preview.title": "Vista previa",
  "notifications.pause.preview.range":
    "Las notificaciones se silenciarán de {{from}} a {{to}}, de {{start}} a {{end}}.",
  "notifications.pause.preview.days":
    "Las notificaciones se silenciarán los {{days}}, de {{start}} a {{end}}.",
  "notifications.pause.preview.single":
    "Las notificaciones se silenciarán del {{from}} al {{to}}.",
  "notifications.pause.preview.allow": "Seguirán entrando: {{items}}.",
  "notifications.pause.rule.edit": "Editar",
  "notifications.pause.activePauses.title": "Pausas activas",
  "notifications.pause.activePauses.until": "Termina a las {{time}}",
  "notifications.pause.activePauses.none": "No hay pausas activas",
  "notifications.pause.schedule": "Programar pausas",
  "notifications.pause.scheduleDays": "Días",
  "notifications.pause.scheduleStart": "Desde",
  "notifications.pause.scheduleEnd": "Hasta",
  "notifications.pause.scheduleSave": "Guardar",
  "notifications.pause.scheduleList": "Pausas programadas",
  "notifications.pause.scheduleEmpty": "Todavía no tienes pausas programadas",
  "notifications.pause.scheduleDelete": "Eliminar",
  "notifications.pause.scheduleHint": "Elige los días y las horas.",
  "notifications.pause.scheduleTimezone": "Zona horaria: {{timezone}}",
  "notifications.pause.scheduleSaved": "Pausa programada guardada",
  "notifications.pause.scheduleRemoved": "Pausa programada eliminada",
  "notifications.undo.archived": "Notificación archivada",
  "notifications.undo.read": "Notificaciones marcadas como leídas",
  "notifications.undo.deleted": "Notificación borrada",
  "notifications.undo.snoozed": "Notificación pospuesta",
};

function mockTranslate(
  key: string,
  defaultValue?: string | Record<string, unknown>,
  options?: Record<string, unknown>,
) {
  const resolvedOptions =
    options ??
    (defaultValue && typeof defaultValue === "object"
      ? defaultValue
      : undefined);
  let value =
    mockCopy[key] ?? (typeof defaultValue === "string" ? defaultValue : key);
  if (resolvedOptions && typeof resolvedOptions === "object") {
    Object.entries(resolvedOptions).forEach(([name, replacement]) => {
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

let enqueue: jest.Mock;
let closeSnackbar: jest.Mock;

jest.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: enqueue, closeSnackbar }),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUseNotifications = useNotifications as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

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
  archive: jest.fn(),
  unarchive: jest.fn(),
  remove: jest.fn(),
  restore: jest.fn(),
  bulkArchive: jest.fn(),
  bulkUnarchive: jest.fn(),
  bulkDelete: jest.fn(),
  bulkRestore: jest.fn(),
  bulkMarkRead: jest.fn(),
  snooze: jest.fn(),
  unsnooze: jest.fn(),
  pausedUntil: null,
  pauseSchedule: [],
  pauseAllow: [],
  pauseWindow: null,
  activePauses: [],
  pause: jest.fn(),
  resume: jest.fn(),
  savePauseSchedule: jest.fn(),
  savePauseWindow: jest.fn(),
  removePauseSchedule: jest.fn(),
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

const openArchived = async () => {
  fireEvent.click(screen.getByTestId("notification-menu"));
  fireEvent.click(screen.getByTestId("notification-menu-archived"));
  await waitFor(() =>
    expect(mockedUseNotifications).toHaveBeenLastCalledWith("archived", {
      unread: false,
    }),
  );
};

const openTrash = async () => {
  fireEvent.click(screen.getByTestId("notification-menu"));
  fireEvent.click(screen.getByTestId("notification-menu-trash"));
  await waitFor(() =>
    expect(mockedUseNotifications).toHaveBeenLastCalledWith("trash", {
      unread: false,
    }),
  );
};

const sampleItem = (id: string) => ({
  id,
  type: "promo",
  is_read: false,
  created_at: "2026-10-19T10:00:00Z",
  metadata: {},
});

const messageItem = (id: string, metadata: Record<string, unknown>) => ({
  ...sampleItem(id),
  type: "message",
  metadata: { can_reply: true, preview: "hola", ...metadata },
});

const typeAndSend = (text: string) => {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });
  fireEvent.click(
    screen.getByRole("button", { name: "notifications.quickReply.send" }),
  );
};

const touchOn = (x: number, y: number) =>
  ({ touches: [{ clientX: x, clientY: y }] }) as unknown as TouchEventInit;

const swipe = (fromX: number, toX: number) => {
  const box = screen.getByTestId("notification-swipeable");
  fireEvent.touchStart(box, touchOn(fromX, 0));
  fireEvent.touchMove(box, touchOn(toX, 0));
  fireEvent.touchEnd(box);
};

const undoAction = () => {
  const action = enqueue.mock.calls[0][1].action;
  return render(action).getByText("Deshacer");
};

beforeEach(() => {
  jest.clearAllMocks();
  push = jest.fn();
  onClose = jest.fn();
  hook = makeHook();
  enqueue = jest.fn();
  closeSnackbar = jest.fn();
  mockPost.mockReset();
  mockPost.mockResolvedValue({ data: {} });
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

  it("only shows the text label of the active tab", () => {
    renderPanel();

    expect(screen.getByTestId("notification-tab-label-all")).toHaveStyle({
      opacity: "1",
      maxWidth: "120px",
    });
    expect(screen.getByTestId("notification-tab-label-likes")).toHaveStyle({
      opacity: "0",
    });

    fireEvent.click(screen.getByTestId("notification-tab-chats"));

    expect(screen.getByTestId("notification-tab-label-chats")).toHaveStyle({
      opacity: "1",
      maxWidth: "120px",
    });
    expect(screen.getByTestId("notification-tab-label-all")).toHaveStyle({
      opacity: "0",
    });
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
    hook = makeHook({ items: [sampleItem("n1")] });
    mockedUseNotifications.mockImplementation(() => hook);
    renderPanel();

    fireEvent.click(await screen.findByTestId("notification-item-n1"));
    await act(async () => {});

    expect(hook.markRead).toHaveBeenCalledWith("n1");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("wires the close button to onClose", () => {
    renderPanel();
    fireEvent.click(screen.getByTestId("notification-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("offers mark all on every tab and scopes it to that tab", async () => {
    useCounts({ count: 2, all: 2, social: 1, system: 1 });
    renderPanel();

    const readAll = await screen.findByTestId("notification-mark-all");
    expect(readAll).toHaveAttribute("title", "Marcar todas como leídas");
    fireEvent.click(readAll);
    expect(hook.markAllRead).toHaveBeenCalledWith("all");

    fireEvent.click(screen.getByTestId("notification-tab-chats"));
    await waitFor(() =>
      expect(mockedUseNotifications).toHaveBeenLastCalledWith("messages", {
        unread: true,
      }),
    );
    fireEvent.click(screen.getByTestId("notification-mark-all"));
    expect(hook.markAllRead).toHaveBeenLastCalledWith("messages");
  });

  it("shows the unread count and the pause menu", () => {
    useCounts({ count: 12, all: 12, social: 4, system: 8 });
    renderPanel();

    expect(screen.getByTestId("notification-unread-count")).toHaveTextContent(
      "12",
    );
    fireEvent.click(screen.getByTestId("notification-pause"));
    expect(screen.getByText("Pausar notificaciones")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("notification-pause-30m"));

    expect(hook.pause).toHaveBeenCalledWith("30m");
  });

  it("shows the remaining pause time and allows resuming", () => {
    hook = makeHook({
      pausedUntil: new Date(Date.now() + 90 * 60000).toISOString(),
    });
    mockedUseNotifications.mockImplementation(() => hook);
    renderPanel();

    expect(
      screen.getByTestId("notification-pause-remaining"),
    ).toHaveTextContent("1 h 30 min");
    fireEvent.click(screen.getByTestId("notification-pause"));
    fireEvent.click(screen.getByTestId("notification-pause-resume"));

    expect(hook.resume).toHaveBeenCalledTimes(1);
  });

  it("offers the 15m, 30m, 1h, 2h and 8h presets", () => {
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-pause"));
    ["15m", "30m", "1h", "2h", "8h"].forEach((preset) => {
      expect(
        screen.getByTestId(`notification-pause-${preset}`),
      ).toBeInTheDocument();
    });
  });

  it("pauses for exactly 24 hours with the tomorrow option", () => {
    const before = Date.now();
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-pause"));
    fireEvent.click(screen.getByTestId("notification-pause-1d"));

    expect(hook.pause).toHaveBeenCalledWith(undefined, expect.any(String));
    const until = Date.parse(
      (hook.pause as jest.Mock).mock.calls[0][1] as string,
    );
    const delta = until - before;
    expect(delta).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
    expect(delta).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
  });

  it("schedules a weekly pause from the custom option", () => {
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-pause"));
    fireEvent.click(screen.getByTestId("notification-pause-custom"));

    expect(screen.getByTestId("notification-pause-day-0")).toBeInTheDocument();
    expect(screen.getByTestId("notification-pause-start")).toBeInTheDocument();
    expect(screen.getByTestId("notification-pause-end")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("notification-pause-schedule-save"));

    expect(hook.savePauseSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        days: [0, 1, 2, 3, 4],
        start: "18:00",
        end: "08:00",
      }),
    );
  });

  it("removes a scheduled pause from the dialog", () => {
    hook = makeHook({
      pauseSchedule: [
        {
          id: "r1",
          name: "Horario laboral",
          days: [0, 1],
          start: "18:00",
          end: "08:00",
        },
      ],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-pause"));
    fireEvent.click(screen.getByTestId("notification-pause-custom"));
    fireEvent.click(screen.getByTestId("notification-pause-rule-delete-r1"));

    expect(hook.removePauseSchedule).toHaveBeenCalledWith("r1");
  });

  it("shows the active pauses and lists them in a popover", () => {
    hook = makeHook({
      activePauses: [
        {
          kind: "recurring",
          id: "r1",
          name: "Horario laboral",
          days: [0, 1, 2, 3, 4],
          start: "18:00",
          end: "08:00",
          allow: [],
        },
      ],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-active-pauses"));

    expect(
      screen.getByTestId("notification-active-pause-item"),
    ).toHaveTextContent("Horario laboral");
  });

  it("saves a recurring rule with the selected days", () => {
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-pause"));
    fireEvent.click(screen.getByTestId("notification-pause-custom"));
    fireEvent.click(screen.getByTestId("notification-pause-day-0"));
    fireEvent.click(screen.getByTestId("notification-pause-schedule-save"));

    expect(hook.savePauseSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        id: null,
        days: [1, 2, 3, 4],
        start: "18:00",
        end: "08:00",
      }),
    );
  });

  it("saves a one-off window with the allowed exceptions", () => {
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-pause"));
    fireEvent.click(screen.getByTestId("notification-pause-custom"));
    fireEvent.click(screen.getByTestId("notification-pause-mode-single"));
    fireEvent.click(screen.getByTestId("notification-pause-allow-chats"));
    fireEvent.click(screen.getByTestId("notification-pause-schedule-save"));

    expect(hook.savePauseWindow).toHaveBeenCalledWith(
      expect.objectContaining({ allow: ["message"] }),
    );
  });

  describe("⋯ menu", () => {
    it("navigates to the archived view from the menu", async () => {
      useCounts({ count: 1, all: 1, system: 1 });
      renderPanel();

      await openArchived();

      expect(
        screen.queryByTestId("notification-tab-all"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("notification-tab-system"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("notification-mark-all"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("notification-survey-item"),
      ).not.toBeInTheDocument();
    });

    it("goes back to the inbox from the archived view", async () => {
      useCounts({ count: 1, all: 1, system: 1 });
      renderPanel();
      await openArchived();

      fireEvent.click(screen.getByTestId("notification-back"));

      expect(mockedUseNotifications).toHaveBeenLastCalledWith("all", {
        unread: false,
      });
      expect(
        await screen.findByTestId("notification-tab-all"),
      ).toBeInTheDocument();
    });

    it("navigates to the notification settings", async () => {
      renderPanel();

      fireEvent.click(screen.getByTestId("notification-menu"));
      const settingsItem = screen.getByTestId("notification-menu-settings");
      expect(settingsItem).toHaveTextContent("Ajustes");
      fireEvent.click(settingsItem);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith("/settings#notifications");
    });
  });

  describe("selection and bulk actions", () => {
    it("enters selection mode on long press and toggles items", async () => {
      hook = makeHook({ items: [sampleItem("n1"), sampleItem("n2")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      const first = await screen.findByTestId("notification-item-n1");
      fireEvent.contextMenu(first);

      expect(
        await screen.findByTestId("notification-selection-toolbar"),
      ).toHaveTextContent("1 seleccionadas");
      expect(
        screen.queryByTestId("notification-tab-all"),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("notification-item-n2"));
      expect(
        screen.getByTestId("notification-selection-toolbar"),
      ).toHaveTextContent("2 seleccionadas");
      expect(hook.markRead).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId("notification-selection-cancel"));
      expect(
        screen.queryByTestId("notification-selection-toolbar"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("notification-tab-all")).toBeInTheDocument();
    });

    it("selects all and bulk-archives with undo", async () => {
      hook = makeHook({ items: [sampleItem("n1"), sampleItem("n2")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      fireEvent.contextMenu(await screen.findByTestId("notification-item-n1"));
      fireEvent.click(screen.getByTestId("notification-select-all"));
      expect(
        screen.getByTestId("notification-selection-toolbar"),
      ).toHaveTextContent("2 seleccionadas");

      fireEvent.click(screen.getByTestId("notification-bulk-archive"));

      expect(hook.bulkArchive).toHaveBeenCalledWith(["n1", "n2"]);
      expect(
        screen.queryByTestId("notification-selection-toolbar"),
      ).not.toBeInTheDocument();
      expect(enqueue).toHaveBeenCalledWith(
        "Notificación archivada",
        expect.objectContaining({ key: "notification-bulk-n1" }),
      );

      fireEvent.click(undoAction());
      expect(hook.bulkUnarchive).toHaveBeenCalledWith(["n1", "n2"]);
    });

    it("bulk-deletes with undo", async () => {
      hook = makeHook({ items: [sampleItem("n1"), sampleItem("n2")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      fireEvent.contextMenu(await screen.findByTestId("notification-item-n1"));
      fireEvent.click(screen.getByTestId("notification-select-all"));
      fireEvent.click(screen.getByTestId("notification-bulk-delete"));

      expect(hook.bulkDelete).toHaveBeenCalledWith(["n1", "n2"]);
      fireEvent.click(undoAction());
      expect(hook.bulkRestore).toHaveBeenCalledWith(["n1", "n2"]);
    });

    it("bulk-marks the selection as read", async () => {
      hook = makeHook({ items: [sampleItem("n1"), sampleItem("n2")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      fireEvent.contextMenu(await screen.findByTestId("notification-item-n1"));
      fireEvent.click(screen.getByTestId("notification-select-all"));
      fireEvent.click(screen.getByTestId("notification-bulk-mark-read"));

      expect(hook.bulkMarkRead).toHaveBeenCalledWith(["n1", "n2"]);
      expect(
        screen.queryByTestId("notification-selection-toolbar"),
      ).not.toBeInTheDocument();
    });

    it("enters selection mode from the menu", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();
      await screen.findByTestId("notification-item-n1");

      fireEvent.click(screen.getByTestId("notification-menu"));
      fireEvent.click(screen.getByTestId("notification-menu-select"));

      expect(
        screen.getByTestId("notification-selection-toolbar"),
      ).toHaveTextContent("0 seleccionadas");
    });
  });

  describe("trash", () => {
    it("opens the trash and restores items", async () => {
      hook = makeHook({ items: [sampleItem("d1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await openTrash();

      expect(
        screen.getByRole("heading", { name: "Papelera" }),
      ).toBeInTheDocument();
      fireEvent.click(
        await screen.findByTestId("notification-trash-restore-d1"),
      );
      expect(hook.restore).toHaveBeenCalledWith("d1");
      expect(
        screen.queryByTestId("notification-tab-all"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("notification-mark-all"),
      ).not.toBeInTheDocument();
    });

    it("shows the trash empty state", async () => {
      renderPanel();
      await openTrash();

      expect(
        await screen.findByText("La papelera está vacía."),
      ).toBeInTheDocument();
    });
  });

  it("marks everything read globally from the menu", () => {
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-menu"));
    fireEvent.click(screen.getByTestId("notification-menu-mark-all"));

    expect(hook.markAllRead).toHaveBeenCalledWith("all");
  });

  describe("gestures and undo", () => {
    it("archives on a right swipe and undoes with unarchive", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      swipe(0, 90);

      expect(hook.archive).toHaveBeenCalledWith("n1");
      expect(enqueue).toHaveBeenCalledWith(
        "Notificación archivada",
        expect.objectContaining({ autoHideDuration: 5000 }),
      );
      fireEvent.click(undoAction());
      expect(hook.unarchive).toHaveBeenCalledWith("n1");
    });

    it("deletes on a left swipe and undoes with restore", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      swipe(100, 10);

      expect(hook.remove).toHaveBeenCalledWith("n1");
      expect(enqueue).toHaveBeenCalledWith(
        "Notificación borrada",
        expect.objectContaining({ autoHideDuration: 5000 }),
      );
      fireEvent.click(undoAction());
      expect(hook.restore).toHaveBeenCalledWith("n1");
    });

    it("archives from the desktop hover action and passes snackbar dedupe options by id", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      fireEvent.click(screen.getByTestId("notification-hover-archive"));

      expect(hook.archive).toHaveBeenCalledWith("n1");
      expect(hook.markRead).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(enqueue).toHaveBeenCalledWith(
        "Notificación archivada",
        expect.objectContaining({
          autoHideDuration: 5000,
          key: "notification-n1",
          preventDuplicate: true,
        }),
      );
    });

    it("snoozes until tomorrow and undoes with unsnooze", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      fireEvent.click(screen.getByTestId("notification-snooze-trigger"));
      fireEvent.click(await screen.findByTestId("snooze-option-1d"));

      expect(hook.snooze).toHaveBeenCalledWith("n1", "1d");
      expect(enqueue).toHaveBeenCalledWith(
        "Notificación pospuesta",
        expect.objectContaining({ key: "notification-n1" }),
      );
      fireEvent.click(undoAction());
      expect(hook.unsnooze).toHaveBeenCalledWith("n1");
    });

    it("snoozes from the item menu and undoes with unsnooze", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      fireEvent.click(screen.getByTestId("notification-snooze-trigger"));
      fireEvent.click(await screen.findByTestId("snooze-option-1h"));

      expect(hook.snooze).toHaveBeenCalledWith("n1", "1h");
      expect(enqueue).toHaveBeenCalledWith(
        "Notificación pospuesta",
        expect.objectContaining({ autoHideDuration: 5000 }),
      );
      expect(hook.markRead).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.click(undoAction());
      expect(hook.unsnooze).toHaveBeenCalledWith("n1");
    });
  });

  describe("quick reply", () => {
    it("posts to chat/send and marks read only after the post resolves", async () => {
      hook = makeHook({
        items: [messageItem("n1", { conversation_id: "c1" })],
      });
      mockedUseNotifications.mockImplementation(() => hook);
      let resolvePost!: (value: unknown) => void;
      mockPost.mockReturnValue(
        new Promise((resolve) => {
          resolvePost = resolve;
        }),
      );
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      typeAndSend("hola");

      expect(mockPost).toHaveBeenCalledWith("/chat/send", {
        conversation_id: "c1",
        content: "hola",
      });
      expect(hook.markRead).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();

      await act(async () => {
        resolvePost({ data: {} });
      });
      await waitFor(() => expect(hook.markRead).toHaveBeenCalledWith("n1"));
      expect(hook.markRead).toHaveBeenCalledTimes(1);
      expect(closeSnackbar).toHaveBeenCalledWith("quick-reply-n1");
    });

    it("falls back to the legacy match_id contract", async () => {
      hook = makeHook({ items: [messageItem("n1", { match_id: "m1" })] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      typeAndSend("hola");

      await waitFor(() =>
        expect(mockPost).toHaveBeenCalledWith("/chat/send", {
          match_id: "m1",
          content: "hola",
        }),
      );
      await waitFor(() => expect(hook.markRead).toHaveBeenCalledWith("n1"));
    });

    it("does nothing when the notification has no target", async () => {
      hook = makeHook({ items: [messageItem("n1", {})] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      typeAndSend("hola");
      await act(async () => {});

      expect(mockPost).not.toHaveBeenCalled();
      expect(hook.markRead).not.toHaveBeenCalled();
      expect(enqueue).not.toHaveBeenCalled();
    });

    it("shows an error snackbar with a working retry on failure", async () => {
      hook = makeHook({
        items: [messageItem("n1", { conversation_id: "c1" })],
      });
      mockedUseNotifications.mockImplementation(() => hook);
      mockPost.mockRejectedValueOnce(new Error("boom"));
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      typeAndSend("hola");

      await waitFor(() =>
        expect(enqueue).toHaveBeenCalledWith(
          "No pudimos cargar tus notificaciones.",
          expect.objectContaining({
            variant: "error",
            key: "quick-reply-n1",
          }),
        ),
      );
      expect(hook.markRead).not.toHaveBeenCalled();

      const action = enqueue.mock.calls[0][1].action;
      fireEvent.click(render(action).getByText("Reintentar"));

      await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(2));
      expect(mockPost).toHaveBeenLastCalledWith("/chat/send", {
        conversation_id: "c1",
        content: "hola",
      });
      await waitFor(() => expect(hook.markRead).toHaveBeenCalledWith("n1"));
    });
  });

  it("bumps an item whose updated_at changed and clears the pulse", async () => {
    hook = makeHook({
      items: [{ ...sampleItem("n1"), updated_at: "2026-10-19T10:00:00Z" }],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    const { rerender } = renderPanel();

    const initial = await screen.findByTestId("notification-item-n1");
    expect(getComputedStyle(initial).animation).not.toContain(
      "notification-bump",
    );

    hook = makeHook({
      items: [{ ...sampleItem("n1"), updated_at: "2026-10-19T10:05:00Z" }],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    rerender(<NotificationPanel onClose={onClose} />);

    const bumped = screen.getByTestId("notification-item-n1");
    expect(bumped).not.toBe(initial);
    expect(getComputedStyle(bumped).animation).toContain("notification-bump");

    await waitFor(
      () =>
        expect(
          getComputedStyle(screen.getByTestId("notification-item-n1"))
            .animation,
        ).not.toContain("notification-bump"),
      { timeout: 2000 },
    );
  });

  it("does not bump when a refetch returns unchanged timestamps", async () => {
    hook = makeHook({
      items: [{ ...sampleItem("n1"), updated_at: "2026-10-19T10:00:00Z" }],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    const { rerender } = renderPanel();

    const initial = await screen.findByTestId("notification-item-n1");

    hook = makeHook({
      items: [{ ...sampleItem("n1"), updated_at: "2026-10-19T10:00:00Z" }],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    rerender(<NotificationPanel onClose={onClose} />);

    const current = screen.getByTestId("notification-item-n1");
    expect(current).toBe(initial);
    expect(getComputedStyle(current).animation).not.toContain(
      "notification-bump",
    );
  });

  it("prunes bump history for items no longer present", async () => {
    hook = makeHook({
      items: [{ ...sampleItem("n1"), updated_at: "2026-10-19T10:00:00Z" }],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    const { rerender } = renderPanel();

    await screen.findByTestId("notification-item-n1");

    hook = makeHook({ items: [sampleItem("n2")] });
    mockedUseNotifications.mockImplementation(() => hook);
    rerender(<NotificationPanel onClose={onClose} />);
    await screen.findByTestId("notification-item-n2");

    hook = makeHook({
      items: [{ ...sampleItem("n1"), updated_at: "2026-10-19T10:05:00Z" }],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    rerender(<NotificationPanel onClose={onClose} />);

    expect(
      getComputedStyle(screen.getByTestId("notification-item-n1")).animation,
    ).not.toContain("notification-bump");
  });

  describe("archived view", () => {
    it("restores and deletes items through the hook", async () => {
      hook = makeHook({
        items: [messageItem("a1", { conversation_id: "c1" })],
      });
      mockedUseNotifications.mockImplementation(() => hook);
      const { unarchive, remove } = hook;
      renderPanel();

      await openArchived();

      fireEvent.click(await screen.findByTestId("notification-restore-a1"));
      expect(unarchive).toHaveBeenCalledWith("a1");

      fireEvent.click(screen.getByTestId("notification-delete-a1"));
      expect(remove).toHaveBeenCalledWith("a1");
      expect(
        screen.queryByTestId("notification-swipeable"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("notification-snooze-trigger"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("notification-quick-reply"),
      ).not.toBeInTheDocument();
    });

    it("shows the archived empty state without the survey", async () => {
      useCounts({ count: 1, all: 1, system: 1, survey_pending: 1 });
      renderPanel();

      await openArchived();

      expect(await screen.findByText("Nada archivado.")).toBeInTheDocument();
      expect(
        screen.queryByTestId("notification-survey-item"),
      ).not.toBeInTheDocument();
    });
  });
});
