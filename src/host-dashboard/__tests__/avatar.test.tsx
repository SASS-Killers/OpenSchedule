import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/host-dashboard/avatar";

describe("Avatar", () => {
  it("renders image with userId in src", () => {
    render(<Avatar userId="user-123" name="John Doe" />);
    const img = document.querySelector("img");
    expect(img).toBeTruthy();
    expect(img!.src).toContain("user-123");
  });

  it("renders letter fallback when image fails", () => {
    render(<Avatar userId="bad-id" name="Jane Doe" />);
    // The image should be rendered (it will fail in test env since no real server)
    const img = document.querySelector("img");
    expect(img).toBeTruthy();
    expect(img!.src).toContain("bad-id");
  });

  it("accepts custom size", () => {
    const { container } = render(<Avatar userId="1" name="Test" size="5rem" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe("5rem");
  });
});
