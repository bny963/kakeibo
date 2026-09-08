import { describe, expect, it } from "vitest";
import { cn, formatYen, normalizeFullWidthAscii, normalizeIntegerInput } from "@/lib/utils";

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

describe("normalizeIntegerInput", () => {
  it("converts full-width digits to half-width", () => {
    expect(normalizeIntegerInput("１２３４")).toBe("1234");
  });

  it("strips non-digit characters, including decimal points", () => {
    expect(normalizeIntegerInput("1,234.56円")).toBe("123456");
  });

  it("returns an empty string when nothing numeric was entered", () => {
    expect(normalizeIntegerInput("abc")).toBe("");
  });
});

describe("normalizeFullWidthAscii", () => {
  it("converts a full-width email address to half-width", () => {
    expect(normalizeFullWidthAscii("ｕｓｅｒ＠ｅｘａｍｐｌｅ．ｃｏｍ")).toBe("user@example.com");
  });

  it("leaves an already half-width string unchanged", () => {
    expect(normalizeFullWidthAscii("user@example.com")).toBe("user@example.com");
  });
});
