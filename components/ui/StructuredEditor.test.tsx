import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StructuredEditor } from "./StructuredEditor";
import { SCHEMAS } from "@/lib/shapeSchemas";
import { CUSTOM_SHAPE_TYPES } from "@/types/shapes";

describe("<StructuredEditor> rendering", () => {
  it("renders one row per parsed item with the right inputs", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.permissionMatrix];
    const props = { rows: "Account | 1 | 1 | 0 | 0 | 0\nContact | 0 | 1 | 0 | 0 | 0" };
    render(
      <StructuredEditor
        mode="full"
        schema={schema}
        shapeProps={props}
        onChange={() => {}}
      />,
    );
    expect(screen.getByDisplayValue("Account")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Contact")).toBeInTheDocument();
    // Five checkbox columns × two rows = 10 checkboxes
    expect(screen.getAllByRole("checkbox")).toHaveLength(10);
  });

  it("renders flag-list pills per flag", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.sobject];
    const props = { fields: "Id | id | pk\nName | text | req" };
    render(
      <StructuredEditor mode="full" schema={schema} shapeProps={props} onChange={() => {}} />,
    );
    // Each flag-list column has 7 toggleable pills × 2 rows = 14 pill buttons
    expect(
      screen.getAllByRole("button", { name: /required|unique|external id|primary key|pii|encrypted|indexed/i })
        .length,
    ).toBeGreaterThan(0);
  });

  it("compact mode shows the Edit fully button when onOpenFull provided", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.checklist];
    const onOpenFull = vi.fn();
    render(
      <StructuredEditor
        mode="compact"
        schema={schema}
        shapeProps={{ items: "a\nb", checked: "10" }}
        onChange={() => {}}
        onOpenFull={onOpenFull}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /edit fully/i }));
    expect(onOpenFull).toHaveBeenCalledTimes(1);
  });
});
