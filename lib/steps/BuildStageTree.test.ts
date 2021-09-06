import { describe, it } from "https://deno.land/x/test_suite@v0.8.0/mod.ts";
import { assertEquals } from "https://deno.land/std@0.103.0/testing/asserts.ts";

import { Step } from "./Step.ts";
import { BuildStageTree } from "./BuildStageTree.ts";

describe("BuildStageTree", () => {
  const stepCustomiser = (
    opts: Record<string, unknown>,
  ) => [new Step({ ...opts, key: "1" }), new Step({ ...opts, key: "2" })];

  describe("with only one stage", () => {
    it("returns a list of one constructed step when only one step was given", () => {
      const result = BuildStageTree("Dev")(stepCustomiser);

      assertEquals(result, [
        new Step({
          key: "1",
          stageIndex: 0,
          stepName: "Dev",
          upperStepName: "DEV",
          lowerStepName: "dev",
        }),
        new Step({
          key: "2",
          stageIndex: 0,
          stepName: "Dev",
          upperStepName: "DEV",
          lowerStepName: "dev",
        }),
      ]);
    });

    it("returns a list of multiple constructed steps when given multiple names", () => {
      const result = BuildStageTree({
        "Prod": { if: "branch === main" },
        "Sandbox": { if: "branch === main" },
      })(stepCustomiser);

      assertEquals(result, [
        new Step({
          key: "1",
          stageIndex: 0,
          if: "branch === main",
          stepName: "Prod",
          upperStepName: "PROD",
          lowerStepName: "prod",
        }),
        new Step({
          key: "2",
          stageIndex: 0,
          if: "branch === main",
          stepName: "Prod",
          upperStepName: "PROD",
          lowerStepName: "prod",
        }),
        new Step({
          key: "1",
          stageIndex: 0,
          if: "branch === main",
          stepName: "Sandbox",
          upperStepName: "SANDBOX",
          lowerStepName: "sandbox",
        }),
        new Step({
          key: "2",
          stageIndex: 0,
          if: "branch === main",
          stepName: "Sandbox",
          upperStepName: "SANDBOX",
          lowerStepName: "sandbox",
        }),
      ]);
    });
  });
  describe({
    name: "with two stages",
    fn: () => {
      const stage1Description = "Qa";
      const stage2Description = {
        "Prod": { if: "branch === main" },
        "Sandbox": { if: "branch === main" },
      };

      const result = BuildStageTree(
        stage1Description,
        stage2Description,
      )(stepCustomiser);

      it("returns a list of all constructed steps", () => {
        assertEquals(
          result.map(({ opts }) =>
            (opts as unknown as { stepName: string }).stepName
          ),
          ["Qa", "Qa", "Prod", "Prod", "Sandbox", "Sandbox"],
        );
      });

      it({
        name:
          "is identical to two single-stage constructs, with dependencies added",
        fn: () => {
          const stage1 = BuildStageTree(stage1Description)(stepCustomiser);
          const stage2 = BuildStageTree({
            ...mapValues(
              stage2Description,
              (e) => ({ ...e, dependsOn: stage1 }),
            ),
          })(({ stageIndex, ...opts }) =>
            stepCustomiser({ stageIndex: stageIndex + 1, ...opts })
          );

          assertEquals(stage1, [
            new Step({
              key: "1",
              stageIndex: 0,
              stepName: "Qa",
              upperStepName: "QA",
              lowerStepName: "qa",
            }),
            new Step({
              key: "2",
              stageIndex: 0,
              stepName: "Qa",
              upperStepName: "QA",
              lowerStepName: "qa",
            }),
          ]);
          assertEquals(stage2, [
            new Step({
              key: "1",
              stageIndex: 1,
              stepName: "Prod",
              upperStepName: "PROD",
              lowerStepName: "prod",
              dependsOn: stage1,
              if: "branch === main",
            }),
            new Step({
              key: "2",
              stageIndex: 1,
              stepName: "Prod",
              upperStepName: "PROD",
              lowerStepName: "prod",
              dependsOn: stage1,
              if: "branch === main",
            }),

            new Step({
              key: "1",
              stageIndex: 1,
              stepName: "Sandbox",
              upperStepName: "SANDBOX",
              lowerStepName: "sandbox",
              dependsOn: stage1,
              if: "branch === main",
            }),
            new Step({
              key: "2",
              stageIndex: 1,
              stepName: "Sandbox",
              upperStepName: "SANDBOX",
              lowerStepName: "sandbox",
              dependsOn: stage1,
              if: "branch === main",
            }),
          ]);

          assertEquals(result, [...stage1, ...stage2]);
        },
      });
    },
  });
});

function mapValues<Key extends string | number | symbol, V1, V2>(
  o: Record<Key, V1>,
  fn: (v: V1) => V2,
): Record<Key, V2> {
  return Object.entries(o)
    .reduce(
      (agg, [k, v]) => ({ ...agg, [k]: fn(v as V1) }),
      {} as Record<Key, V2>,
    );
}
