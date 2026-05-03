import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { MobileMenu } from "../src/components/hamburger-menu";

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

describe("MobileMenu", () => {
  it("does not render when closed", () => {
    render(
      <MemoryRouter>
        <MobileMenu isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
  });

  it("renders menu and navigates when item clicked", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <MobileMenu isOpen onClose={onClose} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Calming Tools" }));
    expect(navigateMock).toHaveBeenCalledWith("/support");
    expect(onClose).toHaveBeenCalled();
  });
});
