import { render, screen, fireEvent } from "@testing-library/react";
import CareVersionsPanel from "./CareVersionsPanel";

const versions = [
  {
    version: 3,
    status: "active",
    blocks: {},
    chaos_factor: 5,
    chaos_seed: null,
    min_compatibility: 0,
    match_critical: 0.15,
    changelog: "actual",
    created_by: "maria",
    created_at: "2026-10-16T12:00:00Z",
  },
  {
    version: 2,
    status: "archived",
    blocks: {},
    chaos_factor: 0,
    chaos_seed: null,
    min_compatibility: 0,
    match_critical: 0.15,
    changelog: "prev",
    created_by: "maria",
    created_at: "2026-10-15T12:00:00Z",
  },
];

describe("CareVersionsPanel", () => {
  it("renders one row per version and marks the active one", () => {
    render(
      <CareVersionsPanel
        versions={versions}
        activeVersion={3}
        onRollback={jest.fn()}
      />,
    );
    expect(screen.getByTestId("version-row-3")).toBeInTheDocument();
    expect(screen.getByTestId("version-row-2")).toBeInTheDocument();
    expect(screen.getByTestId("version-active")).toBeInTheDocument();
  });

  it("emits onRollback with the version number", () => {
    const onRollback = jest.fn();
    render(
      <CareVersionsPanel
        versions={versions}
        activeVersion={3}
        onRollback={onRollback}
      />,
    );
    fireEvent.click(screen.getByTestId("rollback-2"));
    expect(onRollback).toHaveBeenCalledWith(2);
  });

  it("shows a loading indicator", () => {
    render(
      <CareVersionsPanel
        versions={[]}
        activeVersion={null}
        loading
        onRollback={jest.fn()}
      />,
    );
    expect(screen.getByTestId("versions-loading")).toBeInTheDocument();
  });
});
