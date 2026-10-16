import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminLogin from "./login";
import adminApiClient from "../../../services/adminApi";

jest.mock("next/router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock("../../../components/auth/AuthLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({ adminAuth: { isAuthenticated: false } }),
}));

jest.mock("../../../services/adminApi", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

const mockPost = adminApiClient.post as jest.Mock;

const employee = {
  id: "emp-1",
  email: "admin@redthread.com",
  first_name: "Ada",
  last_name: "Lovelace",
  roles: ["admin"],
  avatar: null,
};

const fillAndSubmit = async () => {
  fireEvent.change(screen.getByLabelText(/^email administrativo/i), {
    target: { value: "admin@redthread.com" },
  });
  fireEvent.change(screen.getByLabelText(/^contraseña/i), {
    target: { value: "secret" },
  });
  fireEvent.click(screen.getByRole("button", { name: /acceder al portal/i }));
};

beforeEach(() => {
  mockPost.mockReset();
  mockPost.mockResolvedValue({ data: { employee } });
});

describe("Admin login: Recordarme", () => {
  it("sends remember_me false by default", async () => {
    render(<AdminLogin />);
    await fillAndSubmit();

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/portal-redthread/auth/login", {
        email: "admin@redthread.com",
        password: "secret",
        remember_me: false,
      }),
    );
  });

  it("sends remember_me true when checked", async () => {
    render(<AdminLogin />);
    fireEvent.click(screen.getByRole("checkbox", { name: /recordarme/i }));
    await fillAndSubmit();

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/portal-redthread/auth/login", {
        email: "admin@redthread.com",
        password: "secret",
        remember_me: true,
      }),
    );
  });
});
