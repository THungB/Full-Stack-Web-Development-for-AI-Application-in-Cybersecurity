import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("@phosphor-icons/react", () => {
  const createIcon = (name) => {
    const Icon = React.forwardRef(({ children, ...props }, ref) =>
      React.createElement(
        "span",
        {
          ref,
          ...props,
          "data-icon": name,
        },
        children,
      ),
    );

    Icon.displayName = name;
    return Icon;
  };

  return {
    __esModule: true,
    ArrowsClockwise: createIcon("ArrowsClockwise"),
    ArrowUpRight: createIcon("ArrowUpRight"),
    Broom: createIcon("Broom"),
    CaretRight: createIcon("CaretRight"),
    ChartBar: createIcon("ChartBar"),
    CheckCircle: createIcon("CheckCircle"),
    ClockCounterClockwise: createIcon("ClockCounterClockwise"),
    Gauge: createIcon("Gauge"),
    Minus: createIcon("Minus"),
    Plus: createIcon("Plus"),
    Question: createIcon("Question"),
    RocketLaunch: createIcon("RocketLaunch"),
    ShieldCheck: createIcon("ShieldCheck"),
    TextAlignLeft: createIcon("TextAlignLeft"),
    Trash: createIcon("Trash"),
    WarningCircle: createIcon("WarningCircle"),
  };
});
