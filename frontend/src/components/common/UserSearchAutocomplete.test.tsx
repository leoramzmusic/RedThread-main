import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserSearchAutocomplete from "./UserSearchAutocomplete";
import adminApiClient from "../../services/adminApi";

jest.mock("../../services/adminApi", () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockGet = adminApiClient.get as jest.Mock;

const USERS = [
  {
    id: "u1",
    email: "john@x.com",
    display_name: "John Doe",
    nickname: "johnd",
    photo: null,
  },
  {
    id: "u2",
    email: "ana@x.com",
    display_name: "Ana Ruiz",
    nickname: "anar",
    photo: "https://img/ana.png",
  },
];

const renderField = (props: Record<string, unknown> = {}) =>
  render(
    <UserSearchAutocomplete
      label="Perfil A"
      value={null}
      onChange={jest.fn()}
      {...props}
    />,
  );

const typeSearch = (value: string) => {
  const input = screen.getByRole("combobox");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
};

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockResolvedValue({ data: { users: USERS } });
});

describe("UserSearchAutocomplete", () => {
  it("renders the label and placeholder", () => {
    renderField({ placeholder: "Buscar usuario por nombre o alias" });
    expect(
      screen.getByPlaceholderText("Buscar usuario por nombre o alias"),
    ).toBeInTheDocument();
  });

  it("fetches matching users after debounce and lists them", async () => {
    renderField();
    typeSearch("jo");

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith(
        "/portal-redthread/usuarios/listado",
        expect.objectContaining({
          params: expect.objectContaining({ search: "jo", limit: 10 }),
        }),
      ),
    );

    fireEvent.mouseDown(screen.getByRole("combobox"));
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Ana Ruiz")).toBeInTheDocument();
  });

  it("calls onChange with the selected user", async () => {
    const onChange = jest.fn();
    renderField({ onChange });
    typeSearch("jo");

    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByText("John Doe"));

    expect(onChange).toHaveBeenCalledWith(USERS[0]);
  });

  it("clears the selection via the chip delete button", () => {
    const onChange = jest.fn();
    renderField({ value: USERS[0], onChange });

    fireEvent.click(document.querySelector(".MuiChip-deleteIcon") as Element);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("excludes the excludeId user from options", async () => {
    renderField({ excludeId: "u1" });
    typeSearch("jo");

    await waitFor(() => expect(mockGet).toHaveBeenCalled());
    fireEvent.mouseDown(screen.getByRole("combobox"));

    expect(await screen.findByText("Ana Ruiz")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });
});
