import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { XButton } from "../src/components/x-button";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("XButton", () => {
  it("calls onClose when provided", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <XButton onClose={onClose} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("navigates back when onClose is not provided", () => {
    render(
      <MemoryRouter>
        <XButton />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });
});
