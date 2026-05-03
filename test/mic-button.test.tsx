import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MicButton } from "../src/components/mic-button";

describe("MicButton", () => {
  it("calls onClick when pressed", () => {
    const onClick = vi.fn();
    render(<MicButton isActive={false} onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("switches visual style when active", () => {
    const { rerender } = render(<MicButton isActive={false} onClick={vi.fn()} />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("bg-[#7DB0A6]/80");

    rerender(<MicButton isActive onClick={vi.fn()} />);
    expect(button.className).toContain("bg-white");
  });
});
