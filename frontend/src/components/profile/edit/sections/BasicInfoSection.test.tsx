import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { UIProvider } from "../../../../context/UIContext";
import EditBasicInfo from "./BasicInfoSection";

jest.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) =>
      typeof fallback === "string" ? fallback : key,
    i18n: { language: "es" },
  }),
}));

jest.mock("country-codes-list", () => ({
  __esModule: true,
  default: {
    customList: () => ({ MX: "Mexico|+52", US: "United States|+1" }),
  },
}));

const VERIFY_NAME = /verification\.verify$/;

function Harness({
  phoneVerificationEnabled = true,
  emailVerificationEnabled = true,
  onVerifyPhone = jest.fn(),
  onVerifyEmail = jest.fn(),
}: {
  phoneVerificationEnabled?: boolean;
  emailVerificationEnabled?: boolean;
  onVerifyPhone?: jest.Mock;
  onVerifyEmail?: jest.Mock;
}) {
  const { control, setValue, watch } = useForm({
    defaultValues: { email: "", nickname: "" },
  });
  return (
    <UIProvider>
      <EditBasicInfo
      control={control}
      setValue={setValue}
      watch={watch}
      profile={{}}
      verified={false}
      setVerified={() => {}}
      phone=""
      setPhone={() => {}}
      countryCode="+52"
      setCountryCode={() => {}}
      phoneVerified={false}
      isVerifyingPhone={false}
      emailVerified={false}
      isVerifyingEmail={false}
      phoneVerificationEnabled={phoneVerificationEnabled}
      emailVerificationEnabled={emailVerificationEnabled}
      setNicknameDialogOpen={() => {}}
      handleVerifyPhone={onVerifyPhone}
      handleVerifyEmail={onVerifyEmail}
      handleChangePhoneRequest={() => {}}
      />
    </UIProvider>
  );
}

describe("BasicInfoSection (verification kill-switches)", () => {
  it("disables both verify buttons without extra labels when flags are off", () => {
    const onVerifyPhone = jest.fn();
    const onVerifyEmail = jest.fn();
    render(
      <Harness
        phoneVerificationEnabled={false}
        emailVerificationEnabled={false}
        onVerifyPhone={onVerifyPhone}
        onVerifyEmail={onVerifyEmail}
      />,
    );
    const buttons = screen.getAllByRole("button", { name: VERIFY_NAME });
    expect(buttons).toHaveLength(2);
    buttons.forEach((b) => expect(b).toBeDisabled());
    expect(screen.queryByText("Deshabilitado")).not.toBeInTheDocument();
    expect(screen.queryByText("Disponible")).not.toBeInTheDocument();
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(onVerifyPhone).not.toHaveBeenCalled();
    expect(onVerifyEmail).not.toHaveBeenCalled();
  });

  it("enables both verify buttons without extra labels when flags are on", () => {
    const onVerifyPhone = jest.fn();
    render(
      <Harness phoneVerificationEnabled emailVerificationEnabled onVerifyPhone={onVerifyPhone} />,
    );
    const buttons = screen.getAllByRole("button", { name: VERIFY_NAME });
    expect(buttons).toHaveLength(2);
    buttons.forEach((b) => expect(b).toBeEnabled());
    expect(screen.queryByText("Deshabilitado")).not.toBeInTheDocument();
    expect(screen.queryByText("Disponible")).not.toBeInTheDocument();
    fireEvent.click(buttons[1]);
    expect(onVerifyPhone).toHaveBeenCalledTimes(1);
  });
});
