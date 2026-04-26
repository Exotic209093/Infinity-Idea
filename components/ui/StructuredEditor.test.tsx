import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    // 7 flag pills × 2 rows = 14 toggle buttons
    expect(
      screen.getAllByRole("button", { name: /required|unique|external id|primary key|pii|encrypted|indexed/i }),
    ).toHaveLength(14);
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

describe("<StructuredEditor> mutations", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("typing into a text cell calls onChange with a serialized patch", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.permissionMatrix];
    const onChange = vi.fn();
    render(
      <StructuredEditor
        mode="full"
        schema={schema}
        shapeProps={{ rows: "Account | 1 | 0 | 0 | 0 | 0" }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("Account"), { target: { value: "Lead" } });
    vi.advanceTimersByTime(45);
    expect(onChange).toHaveBeenCalledWith({ rows: "Lead | 1 | 0 | 0 | 0 | 0" });
  });

  it("clicking Add row appends an empty row", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.checklist];
    const onChange = vi.fn();
    render(
      <StructuredEditor
        mode="full"
        schema={schema}
        shapeProps={{ items: "a", checked: "0" }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add row/i }));
    vi.advanceTimersByTime(45);
    expect(onChange).toHaveBeenCalledWith({ items: "a\n", checked: "00" });
  });

  it("clicking Delete row removes the row", () => {
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.checklist];
    const onChange = vi.fn();
    render(
      <StructuredEditor
        mode="full"
        schema={schema}
        shapeProps={{ items: "a\nb", checked: "10" }}
        onChange={onChange}
      />,
    );
    const deleteButtons = screen.getAllByRole("button", { name: /delete row/i });
    fireEvent.click(deleteButtons[0]);
    vi.advanceTimersByTime(45);
    expect(onChange).toHaveBeenCalledWith({ items: "b", checked: "0" });
  });
});

describe("<StructuredEditor> debounce", () => {
  it("rapid typing produces one onChange after the idle window", () => {
    vi.useFakeTimers();
    try {
      const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.checklist];
      const onChange = vi.fn();
      render(
        <StructuredEditor
          mode="full"
          schema={schema}
          shapeProps={{ items: "a", checked: "0" }}
          onChange={onChange}
        />,
      );
      const input = screen.getByDisplayValue("a") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "ab" } });
      fireEvent.change(input, { target: { value: "abc" } });
      fireEvent.change(input, { target: { value: "abcd" } });
      expect(onChange).not.toHaveBeenCalled();
      vi.advanceTimersByTime(45);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith({ items: "abcd", checked: "0" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("blur flushes immediately even before the debounce fires", () => {
    vi.useFakeTimers();
    try {
      const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.checklist];
      const onChange = vi.fn();
      render(
        <StructuredEditor
          mode="full"
          schema={schema}
          shapeProps={{ items: "a", checked: "0" }}
          onChange={onChange}
        />,
      );
      const input = screen.getByDisplayValue("a") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "x" } });
      fireEvent.blur(input);
      expect(onChange).toHaveBeenCalledWith({ items: "x", checked: "0" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("unmount flushes pending patch without waiting for the timer", () => {
    // Real timers — unmount is the only thing that can flush.
    const schema = SCHEMAS[CUSTOM_SHAPE_TYPES.checklist];
    const onChange = vi.fn();
    const { unmount } = render(
      <StructuredEditor
        mode="full"
        schema={schema}
        shapeProps={{ items: "a", checked: "0" }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByDisplayValue("a") as HTMLInputElement, { target: { value: "z" } });
    expect(onChange).not.toHaveBeenCalled();
    unmount();
    expect(onChange).toHaveBeenCalledWith({ items: "z", checked: "0" });
  });
});
