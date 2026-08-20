import { describe, expect, it } from "vitest";
import { cn, formatYen } from "@/lib/utils";

describe("formatYen", () => {
  it("formats a positive amount with a 円 suffix and thousands separators", () => {
    expect(formatYen(12345)).toBe("12,345円");
  });

  it("rounds to the nearest whole yen", () => {
    expect(formatYen(1999.6)).toBe("2,000円");
  });

  it("never renders a bare minus sign for zero", () => {
    expect(formatYen(0)).toBe("0円");
  });
});

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});
