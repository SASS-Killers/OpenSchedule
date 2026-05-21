import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FuzzySearch } from "@/ui/fuzzy-search";

const fruits = ["Apple", "Apricot", "Avocado", "Banana", "Cherry", "Grape", "Kiwi", "Mango", "Orange"];

async function wait(ms = 80) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("FuzzySearch", () => {
  it("filters with displayName", async () => {
    render(<FuzzySearch items={fruits} placeholder="Search" displayName={(s) => s.toUpperCase()} />);
    const input = screen.getByPlaceholderText("Search") as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "man" } });
    await wait();
    expect(screen.getByText("MANGO")).toBeTruthy();
  });

  it("shows empty state with no items", () => {
    render(<FuzzySearch items={[]} placeholder="Empty" />);
    expect(screen.getByPlaceholderText("Empty")).toBeTruthy();
  });

  it("selects via keyboard Enter", async () => {
    let picked = "";
    render(
      <FuzzySearch
        items={fruits}
        placeholder="Search"
        onChange={(v) => {
          picked = v;
        }}
      />,
    );
    const input = screen.getByPlaceholderText("Search") as HTMLInputElement;
    fireEvent.focus(input);
    await wait();
    fireEvent.change(input, { target: { value: "cher" } });
    await wait();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    await wait();
    expect(picked).toBe("Cherry");
  });

  it("closes on Escape", async () => {
    render(<FuzzySearch items={fruits} placeholder="Search" />);
    const input = screen.getByPlaceholderText("Search") as HTMLInputElement;
    fireEvent.focus(input);
    await wait();
    fireEvent.change(input, { target: { value: "a" } });
    await wait();
    expect(screen.getByText("Apple")).toBeTruthy();
    fireEvent.keyDown(input, { key: "Escape" });
    await wait();
    expect(screen.queryByText("Apple")).toBeFalsy();
  });

  it("groups by groupBy function", async () => {
    const items = ["Fruit:Apple", "Fruit:Banana", "Color:Red", "Color:Blue"];
    render(
      <FuzzySearch
        items={items}
        placeholder="Group"
        groupBy={(s) => s.split(":")[0]}
        displayName={(s) => s.split(":")[1]}
      />,
    );
    const input = screen.getByPlaceholderText("Group") as HTMLInputElement;
    fireEvent.focus(input);
    await wait();
    fireEvent.change(input, { target: { value: "a" } });
    await wait();
    expect(screen.getByText("Apple")).toBeTruthy();
    expect(screen.getByText("Banana")).toBeTruthy();
  });
});
