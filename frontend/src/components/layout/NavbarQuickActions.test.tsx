import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { store } from "../../store/store";
import { setCredentials } from "../../store/slices/authSlice";
import Layout from "./Layout";
import NavbarSection from "../settings/NavbarSection";

const pushMock = jest.fn();
let unreadCountMock = 0;
let pausedUntilMock: string | null = null;
let navConfigMock: {
  icon_styles?: Record<string, string>;
  quick_actions?: Record<string, boolean>;
} | null = null;

jest.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/home",
    asPath: "/home",
    route: "/home",
    query: {},
    push: (...args: unknown[]) => pushMock(...args),
    replace: jest.fn(),
    locale: "es",
    locales: ["es", "en"],
    defaultLocale: "es",
    isReady: true,
  }),
}));

jest.mock("../../context/UIContext", () => ({
  useUI: () => ({
    sidebarCollapsed: false,
    setSidebarCollapsed: jest.fn(),
    drawerWidth: 260,
  }),
}));

jest.mock("../../context/ThemeContext", () => ({
  useAppTheme: () => ({
    mode: "dark",
    toggleMode: jest.fn(),
    setMode: jest.fn(),
    setTheme: jest.fn(),
  }),
}));

jest.mock("../../context/NavbarContext", () => ({
  useNavbarContext: () => ({ navConfig: navConfigMock, refresh: jest.fn() }),
}));

jest.mock("../../context/YukiConfigContext", () => ({
  useYukiConfig: () => ({ config: null, loading: false, refresh: jest.fn() }),
}));

jest.mock("../../hooks/useLanguageFallback", () => ({
  useLanguageFallback: () => undefined,
}));

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(async () => ({
      data: { count: unreadCountMock, paused_until: pausedUntilMock },
    })),
    post: jest.fn(async () => ({ data: {} })),
    patch: jest.fn(async () => ({ data: {} })),
  },
}));

jest.mock("notistack", () => ({
  useSnackbar: () => ({
    enqueueSnackbar: jest.fn(),
    closeSnackbar: jest.fn(),
  }),
}));

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

jest.mock("../notifications/NotificationPanel", () => ({
  __esModule: true,
  default: () => <div data-testid="notification-panel" />,
}));

jest.mock("../common/MascotFAB", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../motion/MorphToggleIcon", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("./Footer", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../motion/ThemeSwitch", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../motion/BasicThemeSwitch", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../motion/GlowThemeSwitch", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../motion/SubtleThemeSwitch", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../motion/LiquidThemeSwitch", () => ({
  __esModule: true,
  default: () => null,
}));

class MockWebSocket {
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
}

const originalMatchMedia = window.matchMedia;

beforeAll(() => {
  (global as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket;
  window.matchMedia = ((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia;
});

afterAll(() => {
  window.matchMedia = originalMatchMedia;
});

beforeEach(() => {
  pushMock.mockClear();
  navConfigMock = null;
  unreadCountMock = 0;
  pausedUntilMock = null;
  store.dispatch(
    setCredentials({
      user: {
        user_id: "user-1",
        email: "test@example.com",
        subscription_tier: "free",
      },
    }),
  );
});

const renderLayout = () =>
  render(
    <Provider store={store}>
      <Layout>
        <div>page content</div>
      </Layout>
    </Provider>,
  );

const waitForIcon = async (selector: string): Promise<HTMLElement> => {
  await waitFor(() => expect(document.querySelector(selector)).not.toBeNull());
  return document.querySelector(selector) as HTMLElement;
};

const BELL_SELECTOR = ".rt-bell-icon, .rt-bell-regular, .rt-bell-solid";

const ICON_STYLES = ["basic", "glow", "subtle", "liquid", "premium"];

const bellSignature = (container: HTMLElement) => {
  const icon = container.querySelector(BELL_SELECTOR);
  if (!icon) throw new Error("bell icon not found");
  const root = icon.closest('button, [role="button"]') as HTMLElement | null;
  if (!root) throw new Error("bell root not found");
  return {
    tag: root.tagName,
    classes: Array.from(root.classList).sort().join(" "),
    badge: root.querySelector(".rt-bell-badge")?.textContent ?? null,
    glass: root.querySelector(".rt-bell-glass") !== null,
  };
};

const waitForBell = async (container: HTMLElement) => {
  await waitFor(() =>
    expect(container.querySelector(BELL_SELECTOR)).not.toBeNull(),
  );
  return container.querySelector(BELL_SELECTOR) as HTMLElement;
};

const bellRoot = (container: HTMLElement) =>
  container
    .querySelector(BELL_SELECTOR)
    ?.closest('button, [role="button"]') as HTMLElement;

const inMinutes = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString();

describe("navbar quick actions", () => {
  it("toggles the notification panel from the bell icon", async () => {
    renderLayout();

    expect(screen.queryByTestId("notification-panel")).not.toBeInTheDocument();

    const bell = await waitForIcon(BELL_SELECTOR);
    fireEvent.click(bell);

    await waitFor(() =>
      expect(screen.getByTestId("notification-panel")).toBeInTheDocument(),
    );

    fireEvent.click(bell);

    await waitFor(() =>
      expect(
        screen.queryByTestId("notification-panel"),
      ).not.toBeInTheDocument(),
    );
  });

  it("navigates to the settings page from the gear icon", async () => {
    renderLayout();

    const gear = await waitForIcon(".rt-settings-spin");
    fireEvent.click(gear);

    expect(pushMock).toHaveBeenCalledWith("/settings");
  });

  it("opens the language menu from the globe icon", async () => {
    renderLayout();

    const globe = await waitForIcon(".rt-globe");
    fireEvent.click(globe);

    await waitFor(() =>
      expect(document.getElementById("menu-language")).not.toBeNull(),
    );
  });

  it.each(ICON_STYLES)(
    "keeps the bell toggle and the settings route with the %s icon style",
    async (style) => {
      navConfigMock = {
        icon_styles: { notifications: style, settings: style },
      };

      renderLayout();

      const bell = await waitForIcon(BELL_SELECTOR);
      fireEvent.click(bell);

      await waitFor(() =>
        expect(screen.getByTestId("notification-panel")).toBeInTheDocument(),
      );

      const gear = await waitForIcon(".rt-settings-spin");
      fireEvent.click(gear);

      expect(pushMock).toHaveBeenCalledWith("/settings");
    },
  );
});

describe("notification icon parity", () => {
  it.each(ICON_STYLES)(
    "renders the same bell in the navbar and in the navbar preview with the %s style",
    async (style) => {
      unreadCountMock = 1;
      navConfigMock = { icon_styles: { notifications: style } };

      const { container: navbarContainer } = renderLayout();
      await waitForBell(navbarContainer);

      const { container: previewContainer } = render(
        <Provider store={store}>
          <NavbarSection
            settings={{
              navbar_config: { icon_styles: { notifications: style } },
            }}
            onSettingsChange={jest.fn()}
          />
        </Provider>,
      );
      await waitForBell(previewContainer);

      expect(bellSignature(previewContainer)).toEqual(
        bellSignature(navbarContainer),
      );
    },
  );

  it("uses the configured notification style instead of a hardcoded one", async () => {
    navConfigMock = { icon_styles: { notifications: "premium" } };

    const { container: premiumContainer } = renderLayout();
    await waitForBell(premiumContainer);

    navConfigMock = { icon_styles: { notifications: "liquid" } };

    const { container: liquidContainer } = renderLayout();
    await waitForBell(liquidContainer);

    expect(bellSignature(premiumContainer)).not.toEqual(
      bellSignature(liquidContainer),
    );
  });
});

describe("do not disturb", () => {
  it("hides the badge and the attention state while it is active", async () => {
    unreadCountMock = 3;
    pausedUntilMock = inMinutes(15);

    const { container } = renderLayout();
    await waitForBell(container);

    await waitFor(() =>
      expect(bellRoot(container).getAttribute("data-muted")).toBe("true"),
    );

    const root = bellRoot(container);

    expect(root.hasAttribute("data-active")).toBe(false);
    expect(root.querySelector(".rt-bell-badge")).toBeNull();
    expect(
      container.querySelector('[data-testid="NotificationsOffIcon"]'),
    ).not.toBeNull();
  });

  it("keeps the notification panel reachable while it is active", async () => {
    unreadCountMock = 3;
    pausedUntilMock = inMinutes(15);

    const { container } = renderLayout();
    await waitForBell(container);

    fireEvent.click(container.querySelector(BELL_SELECTOR) as HTMLElement);

    await waitFor(() =>
      expect(screen.getByTestId("notification-panel")).toBeInTheDocument(),
    );
  });

  it("marks the bell as selected when the panel is open during it", async () => {
    unreadCountMock = 3;
    pausedUntilMock = inMinutes(15);

    const { container } = renderLayout();
    await waitForBell(container);

    fireEvent.click(container.querySelector(BELL_SELECTOR) as HTMLElement);

    await waitFor(() => {
      const root = bellRoot(container);
      expect(root.getAttribute("data-muted")).toBe("true");
      expect(root.getAttribute("data-selected")).toBe("true");
      expect(root.hasAttribute("data-active")).toBe(false);
      expect(root.querySelector(".rt-bell-badge")).toBeNull();
    });
  });

  it("renders the same bell in the navbar and in the preview while it is active", async () => {
    unreadCountMock = 3;
    pausedUntilMock = inMinutes(15);
    navConfigMock = { icon_styles: { notifications: "liquid" } };

    const { container: navbarContainer } = renderLayout();
    await waitForBell(navbarContainer);

    const { container: previewContainer } = render(
      <Provider store={store}>
        <NavbarSection
          settings={{
            navbar_config: { icon_styles: { notifications: "liquid" } },
          }}
          onSettingsChange={jest.fn()}
        />
      </Provider>,
    );
    await waitForBell(previewContainer);

    expect(bellSignature(previewContainer)).toEqual(
      bellSignature(navbarContainer),
    );
  });
});
