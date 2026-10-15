import { render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import ProfileCompletionWidget from "./ProfileCompletionWidget";
import apiClient from "../../services/api";

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
    i18n: { language: "es" },
  }),
}));

jest.mock("../../services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

beforeAll(() => {
  // Reduced-motion activo: evita rAF/animaciones en jsdom.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

function Harness({ modulesReady }: { modulesReady: boolean }) {
  const { control } = useForm<any>({
    defaultValues: { nickname: "luna", age: 25, gender: "female" },
  });
  return (
    <ProfileCompletionWidget control={control} modulesReady={modulesReady} />
  );
}

const skeleton = () => document.querySelector('[aria-busy="true"]');
const percentText = () => screen.queryByText(/\d+%/);

describe("ProfileCompletionWidget (gating de inputs asíncronos)", () => {
  it("muestra skeleton y sin % mientras modulesReady=false", () => {
    (apiClient.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<Harness modulesReady={false} />);
    expect(skeleton()).not.toBeNull();
    expect(percentText()).toBeNull();
  });

  it("permanece en skeleton si el fetch de Spotify sigue pendiente aunque modulesReady=true", () => {
    (apiClient.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<Harness modulesReady={true} />);
    expect(skeleton()).not.toBeNull();
    expect(percentText()).toBeNull();
  });

  it("muestra el % recién cuando modules están listos y Spotify resolvió", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });
    const { rerender } = render(<Harness modulesReady={false} />);
    await waitFor(() => expect(skeleton()).not.toBeNull());
    expect(percentText()).toBeNull();

    rerender(<Harness modulesReady={true} />);
    await waitFor(() => expect(percentText()).not.toBeNull());
    expect(skeleton()).toBeNull();
  });
});
