import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { FeatureCard } from "../src/components/feature-card";

describe("FeatureCard", () => {
  it("renders title, description and tags with link", () => {
    render(
      <MemoryRouter>
        <FeatureCard
          icon={<span data-testid="card-icon">i</span>}
          title="Quiet Route"
          description="Find a calmer route home."
          tags={["map", "calm"]}
          href="/map"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Quiet Route")).toBeInTheDocument();
    expect(screen.getByText("Find a calmer route home.")).toBeInTheDocument();
    expect(screen.getByText("# map")).toBeInTheDocument();
    expect(screen.getByText("# calm")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/map");
  });
});
