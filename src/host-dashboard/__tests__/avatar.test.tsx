import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/host-dashboard/avatar";

describe("Avatar", () => {
  it("renders image with userId in src", () => {
    render(<Avatar userId="user-123" name="John Doe" />);
    const img = document.querySelector("img");
    expect(img).toBeTruthy();
    expect(img!.src).toContain("user-123");
  });

  it("renders with custom size", () => {
    const { container } = render(<Avatar userId="1" name="Test" size="5rem" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe("5rem");
  });

  it("sets fallback hidden initially", () => {
    render(<Avatar userId="1" name="Jane" />);
    const fallback = document.querySelector("div[style*='display: none']") as HTMLElement;
    // The fallback div starts with display:none
    const allDivs = document.querySelectorAll("div");
    const fallbackDiv = Array.from(allDivs).find(
      d => (d as HTMLElement).style.display === "none" && d.textContent === "J"
    );
    expect(fallbackDiv).toBeTruthy();
  });

  it("shows image as block by default", () => {
    render(<Avatar userId="1" name="Test" />);
    const img = document.querySelector("img") as HTMLImageElement;
    // Image should be display: block initially
    expect(img.style.display).not.toBe("none");
  });

  it("registers reload function on window", () => {
    render(<Avatar userId="1" name="Test" />);
    expect((window as any).__avatarReload).toBeDefined();
    expect(typeof (window as any).__avatarReload).toBe("function");
  });

  it("reload sets new src with timestamp", () => {
    render(<Avatar userId="u1" name="Test" />);
    const img = document.querySelector("img") as HTMLImageElement;
    const originalSrc = img.src;
    (window as any).__avatarReload();
    expect(img.src).not.toBe(originalSrc);
    expect(img.src).toContain("t=");
  });
});
