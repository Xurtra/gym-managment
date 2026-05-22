import { describe, expect, it } from "vitest";
import { slugify } from "./slug.js";

describe("slugify", () => {
  it("lowercases and converts spaces to hyphens", () => {
    expect(slugify("Demo Strength Club")).toBe("demo-strength-club");
  });

  it("strips Unicode diacritics via NFKD normalization", () => {
    expect(slugify("Café Fitness")).toBe("cafe-fitness");
    expect(slugify("Zürich Gym")).toBe("zurich-gym");
    expect(slugify("Müller Sport")).toBe("muller-sport");
  });

  it("removes leading and trailing hyphens from the result", () => {
    expect(slugify("  --The Gym--  ")).toBe("the-gym");
  });

  it("collapses sequences of non-alphanumeric characters into a single hyphen", () => {
    expect(slugify("Gym   &&&   Fitness")).toBe("gym-fitness");
    expect(slugify("A  B")).toBe("a-b");
  });

  it("removes all non-alphanumeric characters", () => {
    expect(slugify("Gym! @ # $ %")).toBe("gym");
    expect(slugify("Strength.Club")).toBe("strength-club");
  });

  it("handles a string that is already a valid slug", () => {
    expect(slugify("my-gym-slug")).toBe("my-gym-slug");
  });

  it("handles all-special-character strings", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("---")).toBe("");
  });

  it("handles an empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("preserves numeric characters", () => {
    expect(slugify("12345")).toBe("12345");
    expect(slugify("CrossFit #1 Box")).toBe("crossfit-1-box");
  });
});
