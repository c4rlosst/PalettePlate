import { describe, it, expect } from "vitest";
import {
  rainbowDay,
  manilaDay,
  dayBounds,
  type Colour,
} from "../src/lib/rainbow";
describe("rainbow day", () => {
  const food = (colour: Colour, category = "vegetable") => ({
    colour,
    category,
  });
  it("needs four different fruit or vegetable colours", () => {
    expect(
      rainbowDay([food("red"), food("green"), food("orange")]).complete,
    ).toBe(false);
    expect(
      rainbowDay([
        food("red"),
        food("green"),
        food("orange"),
        food("blue-purple"),
      ]).complete,
    ).toBe(true);
  });
  it("does not count repeated colours or grains", () => {
    const result = rainbowDay([
      food("green"),
      food("green", "fruit"),
      food("yellow", "grain"),
    ]);
    expect(result.count).toBe(1);
    expect(result.missing).toContain("yellow");
  });
  it("handles an empty day and every colour", () => {
    expect(rainbowDay([]).count).toBe(0);
    expect(
      rainbowDay(
        ["red", "orange", "yellow", "green", "blue-purple", "white-brown"].map(
          (c) => food(c as Colour),
        ),
      ).count,
    ).toBe(6);
  });
  it("uses Philippine midnight boundaries instead of UTC midnight", () => {
    expect(manilaDay(new Date("2026-11-10T16:00:00Z"))).toBe("2026-11-11");
    const bounds = dayBounds("2026-11-11");
    expect(bounds.start.toISOString()).toBe("2026-11-10T16:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-11-11T16:00:00.000Z");
  });
});
