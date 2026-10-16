import { render, screen, fireEvent } from "@testing-library/react";
import CareFormulaJsonEditor from "./CareFormulaJsonEditor";

describe("CareFormulaJsonEditor", () => {
  it("shows a green chip when valid", () => {
    render(<CareFormulaJsonEditor value="{}" valid onChange={jest.fn()} />);
    expect(screen.getByTestId("json-validity-chip")).toHaveTextContent(
      "JSON válido",
    );
  });

  it("shows a red chip and the error when invalid", () => {
    render(
      <CareFormulaJsonEditor
        value="not-json"
        valid={false}
        error="JSON inválido: revisa la sintaxis."
        onChange={jest.fn()}
      />,
    );
    expect(screen.getByTestId("json-validity-chip")).toHaveTextContent(
      "JSON inválido",
    );
    expect(
      screen.getByText("JSON inválido: revisa la sintaxis."),
    ).toBeInTheDocument();
  });

  it("emits onChange with the typed text", () => {
    const onChange = jest.fn();
    render(<CareFormulaJsonEditor value="" valid onChange={onChange} />);
    const textarea = screen
      .getByTestId("formula-json")
      .querySelector("textarea") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"blocks":{}}' } });
    expect(onChange).toHaveBeenCalledWith('{"blocks":{}}');
  });
});
