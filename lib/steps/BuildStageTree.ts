import { Step } from "./Step.ts";
import { flattenDependencies } from "./StepLike.ts";

type StageDescriptionWithOptions<T> = { [stepName: string]: T };

type StepDescription<T> = T extends (undefined | Record<string, unknown>)
  ? string | StageDescriptionWithOptions<T>
  : StageDescriptionWithOptions<T>;

type StageDescription<T> = StepDescription<T> | StepDescription<T>[];

function normaliseDescription<T>(
  stageDescription: StageDescription<T>,
): StageDescriptionWithOptions<T>[] {
  if (Array.isArray(stageDescription)) {
    return stageDescription.flatMap(normaliseDescription);
  } else if (typeof stageDescription === "string") {
    return [
      { [stageDescription]: undefined as unknown as T },
    ];
  } else {
    return [stageDescription as StageDescriptionWithOptions<T>];
  }
}

type StageCustomiser<T, U extends Step> = (
  options: T & {
    stageIndex: number;
    stepName: string;
    upperStepName: string;
    lowerStepName: string;
  },
) => U | U[];

function buildStage<T, U extends Step>(customiser: StageCustomiser<T, U>) {
  return (
    stage: StageDescriptionWithOptions<T>,
    stageIndex: number,
  ) => {
    return Object
      .entries(stage)
      .flatMap(([stepName, options]) =>
        customiser({
          ...options,
          stageIndex,
          stepName,
          upperStepName: stepName.toUpperCase(),
          lowerStepName: stepName.toLocaleLowerCase(),
        })
      );
  };
}

function linkStages(
  [lastStage = [], ...prev]: Step[][],
  constructedSteps: Step[],
): Step[][] {
  const constructedStage = constructedSteps.map((
    { opts: { dependsOn, ...opts } },
  ) => {
    const depends = flattenDependencies([
      dependsOn,
      ...lastStage,
    ]);

    if (depends === null || depends.length === 0) {
      return new Step(opts);
    } else {
      return new Step({
        ...opts,
        dependsOn: depends,
      });
    }
  });

  return [
    constructedStage,
    lastStage,
    ...prev,
  ];
}

export function BuildStageTree<T extends Record<never, unknown> | undefined>(
  ...stages: StageDescription<T>[]
) {
  return <U extends Step>(customiser: StageCustomiser<T, U>) => {
    return stages
      .flatMap(normaliseDescription)
      .map(buildStage(customiser))
      .reduce(linkStages, [])
      .reverse()
      .flat();
  };
}
