import { UndefinedOptional } from "../deps.ts";

import { Step } from "./Step.ts";
import { flattenDependencies } from "./StepLike.ts";

type NormalisedStageDescription<T> = { steps: string[] } & T;

type StageDescriptionWithOptions<T> =
  | UndefinedOptional<NormalisedStageDescription<T>>
  | { [stepName: string]: T };

type StageDescription<T> = T extends undefined
  ? string | string[] | StageDescriptionWithOptions<undefined>
  : StageDescriptionWithOptions<T>;

type StageDescriptionArg<T> = T & {
  stageIndex: number;
  stepName: string;
  upperStepName: string;
  lowerStepName: string;
};

type StageCustomiser<T, U extends Step> = (
  options: StageDescriptionArg<Omit<T, "steps">>,
) => U | U[];

function normaliseDescription<T>(
  stageDescription: StageDescription<T>,
): NormalisedStageDescription<T> {
  if (stageDescription.steps !== undefined) {
    return stageDescription;
  } else if (
    typeof stageDescription === "string" || Array.isArray(stageDescription)
  ) {
    return {
      steps: [stageDescription].flat(),
    } as NormalisedStageDescription<T>;
  } else {
    const stepsNames = Object.keys(stageDescription);
    if (stepsNames.length !== 1) {
      throw new TypeError(
        `Expected a stage definition with only one key but received an object with keys ${stepsNames}. If multiple steps should be defined for this stage, use { steps: [...stepNames], options: T }`,
      );
    }

    return {
      ...stageDescription[stepsNames[0]],
      steps: stepsNames,
    };
  }
}

function buildStage<T, U extends Step>(customiser: StageCustomiser<T, U>) {
  return (
    { steps, ...options }: NormalisedStageDescription<T>,
    stageIndex: number,
  ) => {
    return steps.flatMap((stepName) =>
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

export function DeploymentStages<T extends Record<never, unknown> | undefined>(
  ...stages: StageDescription<T>[]
) {
  return <U extends Step>(customiser: StageCustomiser<T, U>) => {
    return stages.map(normaliseDescription)
      .map(buildStage(customiser))
      .reduce(linkStages, [])
      .reverse()
      .flat();
  };
}
