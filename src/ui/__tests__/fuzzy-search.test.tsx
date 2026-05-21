import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FuzzySearch } from "@/ui/fuzzy-search";

const fruits = ["Apple", "Apricot", "Avocado", "Banana", "Cherry", "Date", "Grape", "Kiwi", "Lemon", "Mango", "Orange", "Papaya", "Peach", "Pear", "Pineapple", "Plum", "Raspberry", "Strawberry", "Watermelon"];

async function waitForRender(ms = 50) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("FuzzySearch", () => {
  it("renders input with placeholder", () => {
    render(<FuzzySearch items={fruits} placeholder="Search fruit…" />);
    expect(screen.getByPlaceholderText("Search fruit…")).toBeTruthy();
  });

  it("shows filtered results when typing", async () => {
    render(<FuzzySearch items={fruits} placeholder="Search fruit…" />);
    const input = screen.getByPlaceholderText("Search fruit…") as HTMLInputElement;
    fireEvent.focus(input);
    await waitForRender();
    fireEvent.change(input, { target: { value: "app" } });
    await waitForRender();
    expect(screen.getByText("Apple")).toBeTruthy();
    expect(screen.getByText("Pineapple")).toBeTruthy();
  });

  it("shows no matches message when nothing found", async () => {
    render(<FuzzySearch items={fruits} placeholder="Search fruit…" />);
    const input = screen.getByPlaceholderText("Search fruit…") as HTMLInputElement;
    fireEvent.focus(input);
    await waitForRender();
    fireEvent.change(input, { target: { value: "zzzzz" } });
    await waitForRender();
    expect(screen.getByText(/no matches/i)).toBeTruthy();
  });

  it("calls onChange when item selected", async () => {
    let selected = "";
    render(<FuzzySearch items={fruits} placeholder="Search fruit…" onChange={(v) => { selected = v; }} />);
    const input = screen.getByPlaceholderText("Search fruit…") as HTMLInputElement;
    fireEvent.focus(input);
    await waitForRender();
    fireEvent.change(input, { target: { value: "grape" } });
    await waitForRender();
    fireEvent.mouseDown(screen.getByText("Grape"));
    await waitForRender();
    expect(selected).toBe("Grape");
  });

  it("displays selected value after selection", async () => {
    render(<FuzzySearch items={fruits} placeholder="Search fruit…" />);
    const input = screen.getByPlaceholderText("Search fruit…") as HTMLInputElement;
    fireEvent.focus(input);
    await waitForRender();
    fireEvent.change(input, { target: { value: "mango" } });
    await waitForRender();
    fireEvent.mouseDown(screen.getByText("Mango"));
    await waitForRender();
    expect(input.value).toContain("Mango");
  });
});
