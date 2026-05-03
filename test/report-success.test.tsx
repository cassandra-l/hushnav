import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReportSuccess } from "../src/components/report-success";

describe("ReportSuccess", () => {
  it("does not render when closed", () => {
    render(
      <ReportSuccess isOpen={false} onClose={vi.fn()} onViewBadges={vi.fn()} />,
    );

    expect(screen.queryByText("Report Successful!")).not.toBeInTheDocument();
  });

  it("handles done and view badges actions", () => {
    const onClose = vi.fn();
    const onViewBadges = vi.fn();
    render(
      <ReportSuccess isOpen onClose={onClose} onViewBadges={onViewBadges} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByRole("button", { name: "View Badges" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onViewBadges).toHaveBeenCalledTimes(1);
  });
});
