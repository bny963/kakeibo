import { describe, expect, it } from "vitest";
import { cn, formatYen, normalizeFullWidthAscii, normalizeIntegerInput, parseIntegerInput } from "@/lib/utils";

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

  it("does not silently drop decimal points or minus signs", () => {
    expect(normalizeIntegerInput("1.5")).toBe("1.5");
    expect(normalizeIntegerInput("-100")).toBe("-100");
    expect(normalizeIntegerInput("－１００")).toBe("-100");
  });
});

describe("parseIntegerInput", () => {
  it("accepts plain and full-width integers", () => {
    expect(parseIntegerInput("1234")).toEqual({ ok: true, value: 1234 });
    expect(parseIntegerInput("１２３４")).toEqual({ ok: true, value: 1234 });
  });

  it("accepts thousands separators and a 円 / ¥ notation", () => {
    expect(parseIntegerInput("1,234円")).toEqual({ ok: true, value: 1234 });
    expect(parseIntegerInput("¥1,234")).toEqual({ ok: true, value: 1234 });
    expect(parseIntegerInput(" 500 ")).toEqual({ ok: true, value: 500 });
  });

  it("treats an empty field as null so the API can report it as required", () => {
    expect(parseIntegerInput("")).toEqual({ ok: true, value: null });
    expect(parseIntegerInput("  ")).toEqual({ ok: true, value: null });
  });

  it("rejects decimals instead of turning 1.5 into 15", () => {
    expect(parseIntegerInput("1.5")).toMatchObject({ ok: false });
    expect(parseIntegerInput("1,234.56円")).toMatchObject({ ok: false });
  });

  it("rejects negative values instead of turning -100 into 100", () => {
    expect(parseIntegerInput("-100")).toMatchObject({ ok: false });
    expect(parseIntegerInput("－１００")).toMatchObject({ ok: false });
  });

  it("rejects other characters and malformed separators", () => {
    expect(parseIntegerInput("abc")).toMatchObject({ ok: false });
    expect(parseIntegerInput("12a")).toMatchObject({ ok: false });
    expect(parseIntegerInput("1,23")).toMatchObject({ ok: false });
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
