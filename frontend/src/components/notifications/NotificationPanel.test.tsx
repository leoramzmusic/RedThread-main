import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
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
  "notifications.actions.archive": "Archivar",
  "notifications.actions.snooze": "Posponer",
  "notifications.actions.more": "Más acciones",
  "notifications.actions.markRead": "Marcar como leída",
  "notifications.actions.pin": "Fijar arriba",
  "notifications.actions.unpin": "Dejar de fijar",
  "notifications.actions.muteType": "Silenciar este tipo",
  "notifications.actions.hideForever": "No volver a mostrar",
  "notifications.actions.dismiss": "Descartar",
  "notifications.actions.dismissDay": "Descartar por 24 h",
  "notifications.actions.configure": "Configurar notificaciones",
  "notifications.actions.muted": "Tipo silenciado",
  "notifications.actions.pinned": "Notificación fijada",
  "notifications.actions.unpinned": "Notificación desfijada",
  "notifications.reminder.dismissed": "Recordatorio oculto por 24 horas",
  "notifications.reminder.snoozed": "Recordatorio pospuesto",
  "notifications.reminder.muted": "No volveremos a mostrarte este recordatorio",
  "notifications.filters": "Filtrar notificaciones",
  "notifications.tabs.all": "Todo",
  "notifications.tabs.social": "Social",
  "notifications.tabs.messages": "Mensajes",
  "notifications.tabs.system": "Sistema",
  "notifications.sections.pinned": "Fijadas",
  "notifications.sections.social": "Social",
  "notifications.sections.messages": "Mensajes",
  "notifications.sections.system": "Sistema",
  "notifications.priority.critical": "Crítica",
  "notifications.priority.actionRequired": "Acción requerida",
  "notifications.priority.informational": "Informativa",
  "notifications.priority.passive": "Pasiva",
  "notifications.priority.actionRequiredShort": "Acción",
  "notifications.unreadState": "Sin leer",
  "notifications.care.pending_one": "Te falta {{count}} pregunta de CARE",
  "notifications.care.pending_other": "Te faltan {{count}} preguntas de CARE",
  "notifications.empty.all": "Estás al día.",
  "notifications.empty.social": "Sin novedades sociales.",
  "notifications.empty.messages": "Sin mensajes nuevos.",
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
  "notifications.pause.dnd": "No molestar",
  "notifications.pause.activeFor": "Activo durante: {{remaining}}",
  "notifications.pause.shortcut": "Rutina rápida",
  "notifications.pause.summaryTitle": "Resumen de No molestar",
  "notifications.pause.whileAway":
    "Mientras no molestabas llegaron {{count}} notificaciones",
  "notifications.pause.viewAll": "Ver todas",
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
  setPinned: jest.fn(),
  dismissReminder: jest.fn(),
  restoreReminder: jest.fn(),
  pausedUntil: null,
  pauseSchedule: [],
  pauseAllow: [],
  pauseWindow: null,
  pauseShortcutId: null,
  pause: jest.fn(),
  resume: jest.fn(),
  applyPauseShortcut: jest.fn(),
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

const enterSelection = () => {
  fireEvent.click(screen.getByTestId("notification-menu"));
  fireEvent.click(screen.getByTestId("notification-menu-select"));
};

const openItemActions = async (id: string) => {
  const item = await screen.findByTestId(`notification-item-${id}`);
  fireEvent.click(within(item).getByTestId("notification-actions-trigger"));
  await screen.findByTestId("notification-action-read");
  return item;
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
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
});

describe("NotificationPanel", () => {
  it("renders the four filter chips with their unread counts", () => {
    useCounts({
      count: 6,
      all: 6,
      social: 3,
      messages: 2,
      system: 1,
      survey_pending: 1,
    });
    renderPanel();

    expect(screen.getByTestId("notification-chip-all")).toHaveTextContent(
      "Todo",
    );
    expect(screen.getByTestId("notification-chip-social")).toHaveTextContent(
      "Social",
    );
    expect(screen.getByTestId("notification-chip-messages")).toHaveTextContent(
      "Mensajes",
    );
    expect(screen.getByTestId("notification-chip-system")).toHaveTextContent(
      "Sistema",
    );
    expect(screen.getByTestId("notification-chip-all")).toHaveTextContent("6");
    expect(screen.getByTestId("notification-chip-social")).toHaveTextContent(
      "3",
    );
    expect(screen.getByTestId("notification-chip-messages")).toHaveTextContent(
      "2",
    );
    expect(screen.getByTestId("notification-chip-system")).toHaveTextContent(
      "1",
    );
  });

  it("omits zero count badges and keeps collapsed chip names accessible", () => {
    renderPanel();

    const social = screen.getByTestId("notification-chip-social");
    expect(social).not.toHaveTextContent("0");
    expect(social).toHaveAccessibleName(/Social/);
  });

  it("distributes the four filter chips across equal columns", () => {
    renderPanel();

    expect(screen.getByTestId("notification-filters")).toHaveStyle({
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    });
    ["all", "social", "messages", "system"].forEach((key) => {
      expect(screen.getByTestId(`notification-chip-${key}`)).toHaveStyle({
        width: "100%",
      });
    });
  });

  it("only shows the text label of the active chip", () => {
    renderPanel();

    expect(screen.getByTestId("notification-chip-label-all")).toHaveStyle({
      opacity: "1",
      maxWidth: "200px",
    });
    expect(screen.getByTestId("notification-chip-label-social")).toHaveStyle({
      opacity: "0",
    });

    fireEvent.click(screen.getByTestId("notification-chip-messages"));

    expect(screen.getByTestId("notification-chip-label-messages")).toHaveStyle({
      opacity: "1",
      maxWidth: "200px",
    });
    expect(screen.getByTestId("notification-chip-label-all")).toHaveStyle({
      opacity: "0",
    });
  });

  it("marks only the active filter chip as pressed", () => {
    renderPanel();

    expect(screen.getByTestId("notification-chip-all")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("notification-chip-social")).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(screen.getByTestId("notification-chip-messages"));

    expect(screen.getByTestId("notification-chip-messages")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("notification-chip-all")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("requests chats with the unread flag", async () => {
    renderPanel();
    expect(mockedUseNotifications).toHaveBeenLastCalledWith("all", {
      unread: false,
    });

    fireEvent.click(screen.getByTestId("notification-chip-messages"));

    await waitFor(() =>
      expect(mockedUseNotifications).toHaveBeenLastCalledWith("messages", {
        unread: true,
      }),
    );
  });

  it("marks social seen once when social is opened", async () => {
    useCounts({ count: 3, all: 3, social: 2, messages: 1 });
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-chip-social"));
    await waitFor(() => expect(hook.markBucket).toHaveBeenCalledWith("social"));

    fireEvent.click(screen.getByTestId("notification-chip-all"));
    fireEvent.click(screen.getByTestId("notification-chip-social"));
    await waitFor(() =>
      expect(screen.getByTestId("notification-chip-social")).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    expect(hook.markBucket).toHaveBeenCalledTimes(1);
  });

  it("marks system seen once when system is opened", async () => {
    useCounts({ count: 3, all: 3, system: 2, survey_pending: 1 });
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-chip-system"));

    await waitFor(() => expect(hook.markBucket).toHaveBeenCalledWith("system"));
    expect(hook.markBucket).toHaveBeenCalledTimes(1);
  });

  it("does not bulk-mark system when only the survey is pending", async () => {
    useCounts({ count: 1, all: 1, system: 1, survey_pending: 1 });
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-chip-system"));
    await screen.findByTestId("notification-survey-item");

    expect(hook.markBucket).not.toHaveBeenCalled();
  });

  it("pins the survey on Todo and system, and navigates from it", async () => {
    useCounts({ count: 2, all: 2, system: 2, survey_pending: 2 });
    renderPanel();

    expect(
      await screen.findByTestId("notification-survey-item"),
    ).toHaveTextContent("Preferencias CARE");
    expect(screen.getByTestId("notification-survey-item")).toHaveTextContent(
      "Te faltan 2 preguntas",
    );

    fireEvent.click(screen.getByTestId("notification-chip-social"));
    await waitFor(() =>
      expect(
        screen.queryByTestId("notification-survey-item"),
      ).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByTestId("notification-chip-system"));
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

  describe("CARE reminder gestures", () => {
    it("dismisses for 24 hours on a right swipe and undoes", async () => {
      useCounts({ count: 1, all: 1, system: 1, survey_pending: 1 });
      renderPanel();

      await screen.findByTestId("notification-survey-item");
      swipe(0, 130);

      expect(hook.dismissReminder).toHaveBeenCalledWith(
        "care_preferences",
        "1d",
      );
      expect(enqueue).toHaveBeenCalledWith(
        "Recordatorio oculto por 24 horas",
        expect.objectContaining({
          key: "notification-reminder-care_preferences",
        }),
      );
      await waitFor(() =>
        expect(
          screen.queryByTestId("notification-survey-item"),
        ).not.toBeInTheDocument(),
      );

      fireEvent.click(undoAction());
      expect(hook.restoreReminder).toHaveBeenCalledWith("care_preferences");
      expect(
        await screen.findByTestId("notification-survey-item"),
      ).toBeInTheDocument();
    });

    it("hides forever on a long right swipe and undoes", async () => {
      useCounts({ count: 1, all: 1, system: 1, survey_pending: 1 });
      renderPanel();

      await screen.findByTestId("notification-survey-item");
      swipe(0, 250);

      expect(hook.dismissReminder).toHaveBeenCalledWith("care_preferences");
      expect(enqueue).toHaveBeenCalledWith(
        "No volveremos a mostrarte este recordatorio",
        expect.objectContaining({
          key: "notification-reminder-care_preferences",
        }),
      );
      fireEvent.click(undoAction());
      expect(hook.restoreReminder).toHaveBeenCalledWith("care_preferences");
    });

    it("snoozes the reminder from a left swipe", async () => {
      useCounts({ count: 1, all: 1, system: 1, survey_pending: 1 });
      renderPanel();

      await screen.findByTestId("notification-survey-item");
      swipe(130, 0);
      fireEvent.click(await screen.findByTestId("snooze-option-1h"));

      expect(hook.dismissReminder).toHaveBeenCalledWith(
        "care_preferences",
        "1h",
      );
      expect(enqueue).toHaveBeenCalledWith(
        "Recordatorio pospuesto",
        expect.objectContaining({
          key: "notification-reminder-care_preferences",
        }),
      );
      fireEvent.click(undoAction());
      expect(hook.restoreReminder).toHaveBeenCalledWith("care_preferences");
    });

    it("opens the reminder action menu after a hold and mutes it", async () => {
      jest.useFakeTimers();
      try {
        useCounts({ count: 1, all: 1, system: 1, survey_pending: 1 });
        renderPanel();

        const survey = screen.getByTestId("notification-survey-item");
        fireEvent.pointerDown(survey, {
          pointerType: "mouse",
          clientX: 10,
          clientY: 10,
          button: 0,
        });
        act(() => {
          jest.advanceTimersByTime(500);
        });

        expect(
          screen.getByTestId("notification-action-mute"),
        ).toHaveTextContent("No volver a mostrar");
        expect(
          screen.queryByTestId("notification-action-pin"),
        ).not.toBeInTheDocument();
        fireEvent.click(screen.getByTestId("notification-action-mute"));

        expect(hook.dismissReminder).toHaveBeenCalledWith("care_preferences");
      } finally {
        jest.useRealTimers();
      }
    });

    it("dismisses for 24 hours from the reminder action menu", async () => {
      useCounts({ count: 1, all: 1, system: 1, survey_pending: 1 });
      renderPanel();

      const survey = await screen.findByTestId("notification-survey-item");
      fireEvent.contextMenu(survey);
      fireEvent.click(await screen.findByTestId("notification-action-dismiss"));

      expect(hook.dismissReminder).toHaveBeenCalledWith(
        "care_preferences",
        "1d",
      );
    });
  });

  it("shows the per-filter empty state", async () => {
    renderPanel();
    expect(await screen.findByText("Estás al día.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("notification-chip-messages"));
    expect(await screen.findByText("Sin mensajes nuevos.")).toBeInTheDocument();
  });

  it("keeps the CARE pending count out of the header", () => {
    useCounts({ count: 2, all: 2, system: 2, survey_pending: 2 });
    renderPanel();

    expect(
      screen.queryByTestId("notification-care-pending"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("notification-unread-count"),
    ).not.toBeInTheDocument();
  });

  it("groups the inbox into collapsible sections and keeps pinned items first", async () => {
    hook = makeHook({
      items: [
        { ...sampleItem("pin1"), pinned_at: "2026-01-01" },
        { ...sampleItem("social1"), type: "like" },
        { ...sampleItem("message1"), type: "message" },
        { ...sampleItem("system1"), type: "promo" },
      ],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    renderPanel();

    expect(
      await screen.findByTestId("notification-section-pinned"),
    ).toHaveTextContent("Fijadas");
    expect(
      screen.getByTestId("notification-section-count-pinned"),
    ).toHaveTextContent("1");
    expect(screen.getByTestId("notification-section-social")).toHaveTextContent(
      "Social",
    );
    expect(
      screen.getByTestId("notification-section-count-messages"),
    ).toHaveTextContent("1");
    expect(
      screen.getByTestId("notification-section-count-system"),
    ).toHaveTextContent("1");

    const systemHeader = screen.getByTestId("notification-section-system");
    expect(systemHeader).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(systemHeader);

    expect(systemHeader).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByTestId("notification-item-system1"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("notification-item-social1")).toBeInTheDocument();
  });

  it("applies dense, standard and sparse metrics from the loaded count", async () => {
    hook = makeHook({
      items: [sampleItem("n1"), sampleItem("n2")],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    const { rerender } = renderPanel();

    expect(await screen.findByTestId("notification-item-n1")).toHaveAttribute(
      "data-density",
      "sparse",
    );

    hook = makeHook({
      items: [sampleItem("n1"), sampleItem("n2"), sampleItem("n3")],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    rerender(<NotificationPanel onClose={onClose} />);

    expect(screen.getByTestId("notification-item-n1")).toHaveAttribute(
      "data-density",
      "standard",
    );

    hook = makeHook({
      items: Array.from({ length: 13 }, (_, index) => sampleItem(`d${index}`)),
    });
    mockedUseNotifications.mockImplementation(() => hook);
    rerender(<NotificationPanel onClose={onClose} />);

    expect(screen.getByTestId("notification-item-d0")).toHaveAttribute(
      "data-density",
      "dense",
    );
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

  it("keeps mark all visible and scopes it to the active filter", async () => {
    useCounts({ count: 2, all: 2, social: 1, system: 1 });
    renderPanel();

    const readAll = await screen.findByTestId("notification-mark-all");
    expect(readAll).toHaveAttribute("title", "Marcar todas como leídas");
    fireEvent.click(readAll);
    expect(hook.markAllRead).toHaveBeenCalledWith("all");

    fireEvent.click(screen.getByTestId("notification-chip-messages"));
    await waitFor(() =>
      expect(mockedUseNotifications).toHaveBeenLastCalledWith("messages", {
        unread: true,
      }),
    );
    fireEvent.click(screen.getByTestId("notification-mark-all"));
    expect(hook.markAllRead).toHaveBeenLastCalledWith("messages");
  });

  it("opens the pause menu without a header unread badge", () => {
    useCounts({ count: 12, all: 12, social: 4, system: 8 });
    renderPanel();

    expect(
      screen.queryByTestId("notification-unread-count"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("notification-pause"));
    fireEvent.click(screen.getByTestId("notification-pause-30m"));

    expect(hook.pause).toHaveBeenCalledWith("30m");
  });

  it("shows the DND status and allows resuming", () => {
    hook = makeHook({
      pausedUntil: new Date(Date.now() + 90 * 60000).toISOString(),
    });
    mockedUseNotifications.mockImplementation(() => hook);
    renderPanel();

    expect(screen.getByTestId("notification-title")).toHaveTextContent(
      "No molestar",
    );
    expect(
      screen.getByTestId("notification-pause-remaining"),
    ).toHaveTextContent("Activo durante: 1 h 30 min");
    fireEvent.click(screen.getByTestId("notification-pause"));
    fireEvent.click(screen.getByTestId("notification-pause-resume"));

    expect(hook.resume).toHaveBeenCalledTimes(1);
  });

  it("hides resume when no pause is active", () => {
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-pause"));

    expect(
      screen.queryByTestId("notification-pause-resume"),
    ).not.toBeInTheDocument();
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

  it("applies the last used routine from the shortcut row", () => {
    hook = makeHook({
      pauseShortcutId: "r1",
      pauseSchedule: [
        {
          id: "r1",
          name: "Horario laboral",
          days: [0, 1, 2, 3, 4],
          start: "18:00",
          end: "08:00",
        },
      ],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-pause"));
    const shortcut = screen.getByTestId("notification-pause-shortcut");
    expect(shortcut).toHaveTextContent("Horario laboral");
    fireEvent.click(shortcut);

    expect(hook.applyPauseShortcut).toHaveBeenCalledWith("r1");
  });

  it("disables every pause option while DND is active", () => {
    hook = makeHook({
      pausedUntil: new Date(Date.now() + 90 * 60000).toISOString(),
      pauseShortcutId: "r1",
      pauseSchedule: [
        {
          id: "r1",
          name: "Horario laboral",
          days: [0, 1, 2, 3, 4],
          start: "18:00",
          end: "08:00",
        },
      ],
    });
    mockedUseNotifications.mockImplementation(() => hook);
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-pause"));

    expect(
      screen.queryByTestId("notification-active-pause-item"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("notification-pause-shortcut")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    ["15m", "30m", "1h", "2h", "8h"].forEach((preset) => {
      expect(
        screen.getByTestId(`notification-pause-${preset}`),
      ).toHaveAttribute("aria-disabled", "true");
    });
    expect(screen.getByTestId("notification-pause-1d")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByTestId("notification-pause-custom")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByTestId("notification-pause-resume")).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
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
        screen.queryByTestId("notification-filters"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("notification-chip-all"),
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
        await screen.findByTestId("notification-chip-all"),
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
    it("enters selection mode from the header menu and toggles items", async () => {
      hook = makeHook({ items: [sampleItem("n1"), sampleItem("n2")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      enterSelection();

      expect(
        await screen.findByTestId("notification-selection-toolbar"),
      ).toHaveTextContent("0 seleccionadas");
      expect(
        screen.queryByTestId("notification-filters"),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("notification-item-n1"));
      fireEvent.click(screen.getByTestId("notification-item-n2"));
      expect(
        screen.getByTestId("notification-selection-toolbar"),
      ).toHaveTextContent("2 seleccionadas");
      expect(hook.markRead).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId("notification-selection-cancel"));
      expect(
        screen.queryByTestId("notification-selection-toolbar"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("notification-filters")).toBeInTheDocument();
      expect(screen.getByTestId("notification-chip-all")).toBeInTheDocument();
    });

    it("selects all and bulk-archives with undo", async () => {
      hook = makeHook({ items: [sampleItem("n1"), sampleItem("n2")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      enterSelection();
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

      await screen.findByTestId("notification-item-n1");
      enterSelection();
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

      await screen.findByTestId("notification-item-n1");
      enterSelection();
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

      enterSelection();

      expect(
        screen.getByTestId("notification-selection-toolbar"),
      ).toHaveTextContent("0 seleccionadas");
    });
  });

  describe("action menu", () => {
    it("opens from a right click and does not enter selection", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      const item = await screen.findByTestId("notification-item-n1");
      fireEvent.contextMenu(item);

      expect(
        await screen.findByTestId("notification-action-read"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("notification-selection-toolbar"),
      ).not.toBeInTheDocument();
    });

    it("opens after a 500ms hold", async () => {
      jest.useFakeTimers();
      try {
        hook = makeHook({ items: [sampleItem("n1")] });
        mockedUseNotifications.mockImplementation(() => hook);
        renderPanel();

        const item = screen.getByTestId("notification-item-n1");
        fireEvent.pointerDown(item, {
          pointerType: "mouse",
          clientX: 10,
          clientY: 10,
          button: 0,
        });
        act(() => {
          jest.advanceTimersByTime(500);
        });

        expect(
          screen.getByTestId("notification-action-read"),
        ).toBeInTheDocument();
      } finally {
        jest.useRealTimers();
      }
    });

    it("raises the active row and dims the rest", async () => {
      hook = makeHook({ items: [sampleItem("n1"), sampleItem("n2")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      const first = await openItemActions("n1");
      expect(first).toHaveAttribute("data-raised", "true");
      expect(screen.getByTestId("notification-item-n2")).toHaveAttribute(
        "data-dimmed",
        "true",
      );
    });

    it("marks as read from the action menu", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await openItemActions("n1");
      fireEvent.click(screen.getByTestId("notification-action-read"));
      expect(hook.markRead).toHaveBeenCalledWith("n1");
    });

    it("disables mark as read for an already-read notification", async () => {
      hook = makeHook({
        items: [{ ...sampleItem("n1"), is_read: true }],
      });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await openItemActions("n1");
      expect(screen.getByTestId("notification-action-read")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    it("pins and unpins with undo", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await openItemActions("n1");
      fireEvent.click(screen.getByTestId("notification-action-pin"));

      expect(hook.setPinned).toHaveBeenCalledWith("n1", true);
      expect(enqueue).toHaveBeenCalledWith(
        "Notificación fijada",
        expect.objectContaining({ key: "notification-pin-n1" }),
      );
      fireEvent.click(undoAction());
      expect(hook.setPinned).toHaveBeenCalledWith("n1", false);
    });

    it("unpins a pinned notification", async () => {
      hook = makeHook({
        items: [{ ...sampleItem("n1"), pinned_at: "2026-01-01" }],
      });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await openItemActions("n1");
      fireEvent.click(screen.getByTestId("notification-action-pin"));
      expect(hook.setPinned).toHaveBeenCalledWith("n1", false);
    });

    it("mutes the notification type", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await openItemActions("n1");
      fireEvent.click(screen.getByTestId("notification-action-mute"));

      expect(hook.snooze).toHaveBeenCalledWith("n1", "always");
      expect(enqueue).toHaveBeenCalledWith(
        "Tipo silenciado",
        expect.objectContaining({ key: "notification-mute-n1" }),
      );
    });

    it("dismisses from the menu and undoes with restore", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await openItemActions("n1");
      fireEvent.click(screen.getByTestId("notification-action-dismiss"));

      expect(hook.remove).toHaveBeenCalledWith("n1");
      fireEvent.click(undoAction());
      expect(hook.restore).toHaveBeenCalledWith("n1");
    });

    it("opens notification settings from the menu", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await openItemActions("n1");
      fireEvent.click(screen.getByTestId("notification-action-configure"));

      expect(onClose).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith("/settings#notifications");
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
        screen.queryByTestId("notification-filters"),
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

  it("marks everything read globally from the header", () => {
    renderPanel();

    fireEvent.click(screen.getByTestId("notification-mark-all"));

    expect(hook.markAllRead).toHaveBeenCalledWith("all");
  });

  describe("gestures and undo", () => {
    it("dismisses on a right swipe and undoes with restore", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      swipe(0, 130);

      expect(hook.remove).toHaveBeenCalledWith("n1");
      expect(enqueue).toHaveBeenCalledWith(
        "Notificación borrada",
        expect.objectContaining({ autoHideDuration: 5000 }),
      );
      fireEvent.click(undoAction());
      expect(hook.restore).toHaveBeenCalledWith("n1");
    });

    it("opens the snooze menu on a left swipe and snoozes", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      swipe(130, 0);

      expect(hook.snooze).not.toHaveBeenCalled();
      fireEvent.click(await screen.findByTestId("snooze-option-1h"));

      expect(hook.snooze).toHaveBeenCalledWith("n1", "1h");
      expect(enqueue).toHaveBeenCalledWith(
        "Notificación pospuesta",
        expect.objectContaining({ autoHideDuration: 5000 }),
      );
      fireEvent.click(undoAction());
      expect(hook.unsnooze).toHaveBeenCalledWith("n1");
    });

    it("archives from the single desktop quick action and passes snackbar dedupe options by id", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      const item = await screen.findByTestId("notification-item-n1");
      const quickAction = within(item).getByTestId("notification-quick-action");
      expect(quickAction).toHaveAttribute("data-action", "archive");
      fireEvent.click(quickAction);

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

    it("snoozes until tomorrow from a left swipe and undoes with unsnooze", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await screen.findByTestId("notification-item-n1");
      swipe(130, 0);
      fireEvent.click(await screen.findByTestId("snooze-option-1d"));

      expect(hook.snooze).toHaveBeenCalledWith("n1", "1d");
      expect(enqueue).toHaveBeenCalledWith(
        "Notificación pospuesta",
        expect.objectContaining({ key: "notification-n1" }),
      );
      fireEvent.click(undoAction());
      expect(hook.unsnooze).toHaveBeenCalledWith("n1");
    });

    it("snoozes from the action menu and undoes with unsnooze", async () => {
      hook = makeHook({ items: [sampleItem("n1")] });
      mockedUseNotifications.mockImplementation(() => hook);
      renderPanel();

      await openItemActions("n1");
      fireEvent.click(screen.getByTestId("notification-action-snooze"));
      fireEvent.click(await screen.findByTestId("snooze-option-1h"));

      expect(hook.snooze).toHaveBeenCalledWith("n1", "1h");
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
        screen.queryByTestId("notification-actions-trigger"),
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
