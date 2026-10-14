import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import IdentityVerificationDialog from "./IdentityVerificationDialog";
import { UIProvider } from "../../context/UIContext";

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
    i18n: { language: "es" },
  }),
}));

beforeAll(() => {
  window.URL.createObjectURL = jest.fn(() => "blob:mock");
  window.URL.revokeObjectURL = jest.fn();
});

const renderDialog = (props: Record<string, unknown> = {}) =>
  render(
    <UIProvider>
      <IdentityVerificationDialog
        open
        onClose={jest.fn()}
        onSubmit={jest.fn().mockResolvedValue(undefined)}
        {...props}
      />
    </UIProvider>,
  );

const completeDocument = async () => {
  fireEvent.mouseDown(
    screen.getByRole("combobox", { name: "Tipo de Documento" }),
  );
  fireEvent.click(await screen.findByText("INE (México)"));
  const file = new File(["doc"], "doc.jpg", { type: "image/jpeg" });
  fireEvent.change(
    document.getElementById("identity-file-input") as HTMLInputElement,
    { target: { files: [file] } },
  );
};

describe("IdentityVerificationDialog (paginated wizard)", () => {
  it("shows only the document page first with free navigation", () => {
    renderDialog();
    expect(
      screen.getByRole("combobox", { name: "Tipo de Documento" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Toma una selfie/)).not.toBeInTheDocument();
    expect(screen.getByText("Siguiente")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Anterior" }),
    ).toBeDisabled();
    expect(
      screen.queryByText("Enviar para Verificación"),
    ).not.toBeInTheDocument();
  });

  it("navigates freely between pages without completing them", async () => {
    renderDialog();
    fireEvent.click(screen.getByText("Siguiente"));
    expect(await screen.findByText(/Tómate una selfie con tu cámara/)).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: "Tipo de Documento" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(
      await screen.findByRole("combobox", { name: "Tipo de Documento" }),
    ).toBeInTheDocument();
  });

  it("keeps Enviar disabled on the last page until the document is complete", async () => {
    renderDialog();
    fireEvent.click(screen.getByText("Siguiente"));
    expect(
      await screen.findByText("Enviar para Verificación"),
    ).toBeDisabled();
  });

  it("enables Enviar once the document is complete (selfie optional)", async () => {
    renderDialog();
    await completeDocument();
    fireEvent.click(screen.getByText("Siguiente"));
    await waitFor(() =>
      expect(screen.getByText("Enviar para Verificación")).toBeEnabled(),
    );
    expect(screen.queryByText("Listo para enviar")).not.toBeInTheDocument();
  });

  it("shows a single Tomar foto entry button without upload option", async () => {
    renderDialog();
    fireEvent.click(screen.getByText("Siguiente"));
    expect(
      await screen.findByText(/Tómate una selfie con tu cámara/),
    ).toBeInTheDocument();
    expect(screen.getByText("Tomar foto")).toBeInTheDocument();
    expect(screen.queryByText("Subir foto")).not.toBeInTheDocument();
    expect(screen.queryByText("Iniciar cámara")).not.toBeInTheDocument();
  });

  it("shows a camera error and marks the selfie step when camera is unavailable", async () => {
    renderDialog();
    fireEvent.click(screen.getByText("Siguiente"));
    fireEvent.click(await screen.findByText("Tomar foto"));
    expect(
      await screen.findByText(/No se pudo acceder a la cámara/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "2 Selfie" }),
    ).toHaveAttribute("data-state", "error");
  });

  it("captures a selfie through the camera and shows the ready badge", async () => {
    const stop = jest.fn();
    Object.defineProperty(window.navigator, "mediaDevices", {
      value: { getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) },
      configurable: true,
    });
    Object.defineProperty(window.HTMLMediaElement.prototype, "srcObject", {
      set: jest.fn(),
      get: () => null,
      configurable: true,
    });
    Object.defineProperty(window.HTMLMediaElement.prototype, "readyState", {
      get: () => 4,
      configurable: true,
    });
    Object.defineProperty(window.HTMLVideoElement.prototype, "videoWidth", {
      get: () => 640,
      configurable: true,
    });
    Object.defineProperty(window.HTMLVideoElement.prototype, "videoHeight", {
      get: () => 480,
      configurable: true,
    });
    jest
      .spyOn(window.HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue({ drawImage: jest.fn() } as unknown as CanvasRenderingContext2D);
    jest
      .spyOn(window.HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation(function (
        this: HTMLCanvasElement,
        cb: BlobCallback,
      ) {
        cb(new Blob(["selfie"], { type: "image/jpeg" }));
      } as unknown as typeof HTMLCanvasElement.prototype.toBlob);
    renderDialog();
    await completeDocument();
    fireEvent.click(screen.getByText("Siguiente"));
    fireEvent.click(await screen.findByText("Tomar foto"));
    await screen.findByText("Cancelar cámara");
    fireEvent.click(screen.getByRole("button", { name: "Tomar foto" }));
    expect(await screen.findByText("Listo para enviar")).toBeInTheDocument();
  });

  it("marks the document step as error on invalid file", async () => {
    renderDialog();
    const bad = new File(["x"], "doc.txt", { type: "text/plain" });
    fireEvent.change(
      document.getElementById("identity-file-input") as HTMLInputElement,
      { target: { files: [bad] } },
    );
    expect(
      await screen.findByText(/Por favor sube una imagen \(JPG, PNG, WEBP\) o PDF/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "1 Documento" }),
    ).toHaveAttribute("data-state", "error");
    expect(
      screen.getByRole("button", { name: "2 Selfie" }),
    ).toHaveAttribute("data-state", "pending");
  });
});
