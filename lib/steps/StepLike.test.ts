import { describe, it } from "https://deno.land/x/test_suite@v0.8.0/mod.ts";
import { assertEquals } from "https://deno.land/std@0.103.0/testing/asserts.ts";

import { flattenDependencies, StepLike } from "./StepLike.ts";
import { Step } from "./Step.ts";

describe("flattenDependencies", () => {
  it("flattens null to null", () => {
    assertEquals(flattenDependencies(null), null);
  });

  it("flattens [null] to null", () => {
    assertEquals(flattenDependencies([null]), null);
  });

  it("omits null when other dependencies are present", () => {
    const mockDeps = [
      [mockStep("a")],
      null,
      [mockStep("b"), mockStep("c")],
    ];

    const result = flattenDependencies(mockDeps);

    assertEquals(result, [mockStep("a"), mockStep("b"), mockStep("c")]);
  });
});

function mockStep(key: string): StepLike {
  return new Step({ key });
}
