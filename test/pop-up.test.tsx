import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PopUp } from "../src/components/pop-up";

describe("PopUp", () => {
  it("does not render when closed", () => {
    render(
      <PopUp
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Title"
        description="Description"
        buttonText="Confirm"
      />,
    );

    expect(screen.queryByText("Title")).not.toBeInTheDocument();
  });

  it("calls onClose and onConfirm actions", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <PopUp
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete route"
        description="This action cannot be undone."
        buttonText="Delete"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close popup" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
