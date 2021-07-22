import { Step } from "./steps/Step.ts";

export const ifOnMasterOrHotfix = {
  "if":
    'build.branch == "$BUILDKITE_DEFAULT_BRANCH" || build.branch =~ /^hotfix/',
};

export const ifOnHotfix = {
  "if": "build.branch =~ /^hotfix/",
};

export function concurrency(i: number) {
  return {
    concurrency: i,
    concurrency_group: "${BUILDKITE_PIPELINE_NAME}-${BUILDKITE_STEP_KEY}",
  };
}

export function buildPipeline(
  { env, pipeline }: { env: Record<string, string>; pipeline: Step[] },
): void {
  console.log(
    JSON.stringify({
      env,
      steps: deduplicatePipeline(pipeline.flatMap((step) => step.derivedSteps)),
    }),
  );
}

function deduplicatePipeline(steps: PipelineStep[]) {
  function stepHasMatchingKey(key?: string) {
    return function (step: PipelineStep) {
      return ("key" in step) && step.key === key;
    };
  }

  function isDuplicateStep(step: PipelineStep, agg: PipelineStep[]) {
    return ("key" in step) &&
      agg.find(stepHasMatchingKey(step.key)) !== undefined;
  }

  function aggregator(
    agg: PipelineStep[],
    [head, ...tail]: PipelineStep[],
  ): PipelineStep[] {
    const isNewStep = !isDuplicateStep(head, agg);
    if (isNewStep) {
      console.warn(`found new step ${head.key}`);
    }

    const nextAgg = [
      ...agg,
      ...(isNewStep ? [head] : []),
    ];

    if (tail.length > 0) {
      return aggregator(nextAgg, tail);
    } else {
      return nextAgg;
    }
  }

  return aggregator([], steps);
}

type PipelineStep = {
  key?: string;
  "if"?: string;
};
