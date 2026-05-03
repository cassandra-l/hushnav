import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

const MOTION_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "variants",
  "transition",
  "layoutId",
  "whileHover",
  "whileTap",
]);

function stripMotionProps(props: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!MOTION_PROPS.has(key)) cleaned[key] = value;
  }
  return cleaned;
}

type MotionMockProps = {
  children?: React.ReactNode;
} & Record<string, unknown>;

vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>(
    "framer-motion",
  );
  const motion = new Proxy(
    {},
    {
      get: (_, tag: string) => {
        return React.forwardRef<HTMLElement, MotionMockProps>(
          ({ children, ...props }, ref) =>
            React.createElement(
              tag,
              {
                ref,
                ...stripMotionProps(props),
              },
              children as React.ReactNode,
            ),
        );
      },
    },
  );

  return {
    ...actual,
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});
