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
      // todo build pipeline properly
      steps: pipeline,
    }),
  );
}
