import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dropdown } from "@/ui/dropdown";

describe("Dropdown", () => {
  it("renders trigger", () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <div>Content</div>
      </Dropdown>
    );
    expect(screen.getByText("Open")).toBeTruthy();
  });

  it("shows content when trigger clicked", () => {
    render(
      <Dropdown trigger={<button>Open</button>}>
        <div>Dropdown Content</div>
      </Dropdown>
    );
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Dropdown Content")).toBeTruthy();
  });

  it("hides content on second click", () => {
    render(
      <Dropdown trigger={<button>Toggle</button>}>
        <div>Content</div>
      </Dropdown>
    );
    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByText("Content")).toBeTruthy();
    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.queryByText("Content")).toBeFalsy();
  });
});
