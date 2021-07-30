import { describe, it } from "https://deno.land/x/test_suite@v0.8.0/mod.ts";
import { assertEquals } from "https://deno.land/std@0.103.0/testing/asserts.ts";

import { Step } from "./Step.ts";
import { DeploymentStages } from "./DeploymentStages.ts";

describe("DeploymentStages", () => {
  const stepCustomiser = (opts: Record<string, unknown>) => new Step(opts);

  describe("with only one stage", () => {
    it("returns a list of one constructed step when only one step was given", () => {
      const result = DeploymentStages({ steps: ["Dev"] })(stepCustomiser);

      assertEquals(result, [
        new Step({
          stageIndex: 0,
          stepName: "Dev",
          upperStepName: "DEV",
          lowerStepName: "dev",
        }),
      ]);
    });

    it("returns a list of multiple constructed steps when given multiple names", () => {
      const result = DeploymentStages({
        steps: ["Prod", "Sandbox"],
        if: "branch === main",
      })(stepCustomiser);

      assertEquals(result, [
        new Step({
          stageIndex: 0,
          if: "branch === main",
          stepName: "Prod",
          upperStepName: "PROD",
          lowerStepName: "prod",
        }),
        new Step({
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
      const stage1Description = { steps: ["Qa"] };
      const stage2Description = {
        steps: ["Prod", "Sandbox"],
        if: "branch === main",
      };

      const result = DeploymentStages(
        stage1Description,
        stage2Description,
      )(stepCustomiser);

      it("returns a list of all constructed steps", () => {
        assertEquals(
          result.map(({ opts }) =>
            (opts as unknown as { stepName: string }).stepName
          ),
          ["Qa", "Prod", "Sandbox"],
        );
      });

      it({
        name:
          "is identical to two single-stage constructs, with dependencies added",
        fn: () => {
          const stage1 = DeploymentStages(stage1Description)(stepCustomiser);
          const stage2 = DeploymentStages({
            ...stage2Description,
            dependsOn: stage1,
          })(({ stageIndex, ...opts }) =>
            stepCustomiser({ stageIndex: stageIndex + 1, ...opts })
          );

          assertEquals({
            stage1,
            stage2,
          }, {
            stage1: [
              new Step({
                stageIndex: 0,
                stepName: "Qa",
                upperStepName: "QA",
                lowerStepName: "qa",
              }),
            ],
            stage2: [
              new Step({
                stageIndex: 1,
                stepName: "Prod",
                upperStepName: "PROD",
                lowerStepName: "prod",
                dependsOn: stage1,
                if: "branch === main",
              }),

              new Step({
                stageIndex: 1,
                stepName: "Sandbox",
                upperStepName: "SANDBOX",
                lowerStepName: "sandbox",
                dependsOn: stage1,
                if: "branch === main",
              }),
            ],
          });

          assertEquals(result, [...stage1, ...stage2]);
        },
      });
    },
  });
});
