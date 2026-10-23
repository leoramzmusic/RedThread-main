import { render } from "@testing-library/react";
import CareCriteriaPage from "../../../pages/portal-redthread/care/criteria";

const mockReplace = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("CareCriteriaPage", () => {
  it("redirects to the equation editor", () => {
    render(<CareCriteriaPage />);
    expect(mockReplace).toHaveBeenCalledWith("/portal-redthread/care/equation");
  });
});
