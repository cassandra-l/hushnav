import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VolumeBar } from "../src/components/noise-volume-bar";

describe("VolumeBar", () => {
  it("applies provided volume as percent height", () => {
    const { container } = render(<VolumeBar volume={42} />);
    const fill = container.querySelector(".absolute.bottom-0.w-full");

    expect(fill).toHaveStyle({ height: "42%" });
  });
});
