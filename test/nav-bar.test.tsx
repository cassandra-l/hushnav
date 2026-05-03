import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "../src/components/nav-bar";

describe("Navbar", () => {
  it("shows logo text when requested", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Navbar showLogo />
      </MemoryRouter>,
    );

    expect(screen.getByText("HushNav")).toBeInTheDocument();
  });

  it("marks current route link as active", () => {
    render(
      <MemoryRouter initialEntries={["/support"]}>
        <Navbar />
      </MemoryRouter>,
    );

    const supportLink = screen.getByRole("link", { name: "Calming Tool" });
    expect(supportLink.querySelector("span.absolute")).toBeInTheDocument();
  });
});
