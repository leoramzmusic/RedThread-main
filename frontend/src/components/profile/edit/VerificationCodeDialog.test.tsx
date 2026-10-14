import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import VerificationCodeDialog from "./VerificationCodeDialog";
import { UIProvider } from "../../../context/UIContext";

jest.mock("next-i18next/pages", () => {
  const dict: Record<string, string> = {
    "profile.sections.identity.verification.digitLabel": "Digit {{n}} of {{total}}",
  };
  return {
    useTranslation: () => ({
      t: (key: string, arg?: unknown) => {
        const base = typeof arg === "string" ? arg : dict[key] ?? key;
        if (arg && typeof arg === "object") {
          return base.replace(/{{(\w+)}}/g, (_, k: string) =>
            String((arg as Record<string, unknown>)[k] ?? ""),
          );
        }
        return base;
      },
    }),
  };
});

jest.mock("../../../lib/gsap", () => {
  const chain: Record<string, jest.Mock> = {};
  ["to", "from", "fromTo", "set", "add", "call", "play", "kill"].forEach(
    (m) => {
      chain[m] = jest.fn(() => chain);
    },
  );
  const gsap = {
    to: jest.fn(),
    from: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    timeline: jest.fn(() => chain),
    utils: {
      toArray: jest.fn((sel: string, root?: ParentNode) =>
        Array.from((root ?? document).querySelectorAll(sel)),
      ),
    },
    matchMedia: jest.fn(() => ({ add: jest.fn(), revert: jest.fn() })),
  };
  return { gsap, useGSAP: () => undefined, ScrollTrigger: {} };
});

const renderDialog = (props: Record<string, unknown> = {}) => {
  const onConfirm = jest.fn().mockResolvedValue(true);
  const onResend = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  const utils = render(
    <UIProvider>
      <VerificationCodeDialog
        open
        channel="phone"
        target="+52 55 1234 5678"
        error={null}
        onClose={onClose}
        onConfirm={onConfirm}
        onResend={onResend}
        {...props}
      />
    </UIProvider>,
  );
  return { onConfirm, onResend, onClose, ...utils };
};

const slots = () => screen.getAllByRole("textbox") as HTMLInputElement[];

describe("VerificationCodeDialog (card deck OTP)", () => {
  it("renders one input per digit", () => {
    renderDialog();
    expect(slots()).toHaveLength(6);
  });

  it("labels each card by its position for screen readers", () => {
    renderDialog();
    expect(slots().map((s) => s.getAttribute("aria-label"))).toEqual([
      "Digit 1 of 6",
      "Digit 2 of 6",
      "Digit 3 of 6",
      "Digit 4 of 6",
      "Digit 5 of 6",
      "Digit 6 of 6",
    ]);
  });

  it("keeps only digits", () => {
    renderDialog();
    const [first] = slots();
    fireEvent.change(first, { target: { value: "a" } });
    expect(first.value).toBe("");
  });

  it("auto-advances focus on entry and clears on backspace", () => {
    renderDialog();
    const inputs = slots();
    fireEvent.change(inputs[0], { target: { value: "1" } });
    expect(inputs[0].value).toBe("1");
    expect(document.activeElement).toBe(inputs[1]);

    fireEvent.keyDown(inputs[1], { key: "Backspace" });
    expect(inputs[0].value).toBe("");
    expect(document.activeElement).toBe(inputs[0]);
  });

  it("auto-submits with the full code once all slots are filled", async () => {
    const { onConfirm } = renderDialog();
    const inputs = slots();
    "123456".split("").forEach((d, i) => {
      fireEvent.change(inputs[i], { target: { value: d } });
    });
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("123456"));
  });

  it("shows the success mark when the code is accepted", async () => {
    renderDialog();
    const inputs = slots();
    "123456".split("").forEach((d, i) => {
      fireEvent.change(inputs[i], { target: { value: d } });
    });
    expect(await screen.findByText("Confirmado")).toBeInTheDocument();
  });

  it("shows the invalid mark when the code is rejected", async () => {
    renderDialog({ onConfirm: jest.fn().mockResolvedValue(false) });
    const inputs = slots();
    "111111".split("").forEach((d, i) => {
      fireEvent.change(inputs[i], { target: { value: d } });
    });
    expect(await screen.findByText("Error, reintenta")).toBeInTheDocument();
  });

  it("offers a retry action that redraws the empty cards after a rejection", async () => {
    renderDialog({ onConfirm: jest.fn().mockResolvedValue(false) });
    const inputs = slots();
    "111111".split("").forEach((d, i) => {
      fireEvent.change(inputs[i], { target: { value: d } });
    });
    const retry = await screen.findByRole("button", { name: /Reintentar código/ });
    fireEvent.click(retry);
    await waitFor(() => expect(slots().every((s) => s.value === "")).toBe(true));
    await waitFor(() => expect(document.activeElement).toBe(slots()[0]));
  });

  it("distributes a pasted code across the slots", async () => {
    const { onConfirm } = renderDialog();
    const [first] = slots();
    fireEvent.paste(first, {
      clipboardData: { getData: () => "12 34 56" },
    });
    expect(slots().map((s) => s.value).join("")).toBe("123456");
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("123456"));
  });
});
