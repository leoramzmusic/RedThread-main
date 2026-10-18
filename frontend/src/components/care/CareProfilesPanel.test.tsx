import { fireEvent, render, screen } from "@testing-library/react";
import CareProfilesPanel from "./CareProfilesPanel";
import { BUILTIN_PROFILES } from "../../utils/careProfileModel";
import { CANONICAL_BLOCK_WEIGHTS } from "../../constants/careDimensions";

const saved = {
  id: "p1",
  name: "Mi perfil",
  blocks: { ...CANONICAL_BLOCK_WEIGHTS },
  chaos_factor: 0,
  builtin: false,
};

const setup = (
  over: Partial<React.ComponentProps<typeof CareProfilesPanel>> = {},
) => {
  const props = {
    profiles: [...BUILTIN_PROFILES, saved],
    selectedId: null as string | null,
    modified: false,
    onSelect: jest.fn(),
    onSaveAs: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    ...over,
  };
  render(<CareProfilesPanel {...props} />);
  return props;
};

const openSelect = () => {
  fireEvent.mouseDown(screen.getByRole("combobox"));
};

describe("CareProfilesPanel", () => {
  it("groups recommended and saved profiles in the dropdown", () => {
    setup();
    openSelect();
    expect(screen.getByText("Recomendados")).toBeInTheDocument();
    expect(screen.getByText("Guardados")).toBeInTheDocument();
    expect(
      screen.getByTestId("profile-option-builtin:default"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("profile-option-p1")).toBeInTheDocument();
  });

  it("shows 'Sin perfiles guardados' when there are none", () => {
    setup({ profiles: [...BUILTIN_PROFILES] });
    openSelect();
    expect(screen.getByText("Sin perfiles guardados")).toBeInTheDocument();
  });

  it("shows Personalizado when nothing is selected", () => {
    setup();
    expect(screen.getByTestId("profile-select")).toHaveTextContent(
      "Personalizado",
    );
  });

  it("shows (modificado) when the draft drifted from the selection", () => {
    setup({ selectedId: "builtin:default", modified: true });
    expect(screen.getByTestId("profile-select")).toHaveTextContent(
      "Default (modificado)",
    );
  });

  it("disables update/delete for builtins and empty selection", () => {
    setup({ selectedId: "builtin:default" });
    expect(screen.getByTestId("profile-update")).toBeDisabled();
    expect(screen.getByTestId("profile-delete")).toBeDisabled();
    expect(screen.getByTestId("profile-save-as")).not.toBeDisabled();
  });

  it("enables update/delete for a saved selection", () => {
    setup({ selectedId: "p1" });
    expect(screen.getByTestId("profile-update")).not.toBeDisabled();
    expect(screen.getByTestId("profile-delete")).not.toBeDisabled();
  });

  it("emits onSelect when an option is chosen", () => {
    const props = setup();
    openSelect();
    fireEvent.click(screen.getByTestId("profile-option-builtin:default"));
    expect(props.onSelect).toHaveBeenCalledWith("builtin:default");
  });

  it("emits onSaveAs / onUpdate / onDelete", () => {
    const props = setup({ selectedId: "p1" });
    fireEvent.click(screen.getByTestId("profile-save-as"));
    fireEvent.click(screen.getByTestId("profile-update"));
    fireEvent.click(screen.getByTestId("profile-delete"));
    expect(props.onSaveAs).toHaveBeenCalledTimes(1);
    expect(props.onUpdate).toHaveBeenCalledTimes(1);
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });
});
