import { isPresent } from "./deps.ts";
import { Step } from "./steps/Step.ts";
import { StepLikeOpts } from "./steps/StepLike.ts";

export const ifOnMasterOrHotfix = {
  "if":
    'build.branch == "$BUILDKITE_PIPELINE_DEFAULT_BRANCH" || build.branch =~ /^hotfix/',
};

export const ifOnMain = {
  "if": 'build.branch == "$BUILDKITE_PIPELINE_DEFAULT_BRANCH"',
};

export const notOnMaster = {
  "if": 'build.branch != "$BUILDKITE_PIPELINE_DEFAULT_BRANCH"',
};

export const ifOnHotfix = {
  "if": "build.branch =~ /^hotfix/",
};

export function buildPipeline(
  { environment, pipeline }: {
    environment: Record<string, string>;
    pipeline: Step[];
  },
): void {
  console.log(
    JSON.stringify({
      env: environment,
      steps: deduplicatePipeline(pipeline.flatMap((step) => step.derivedSteps)),
    }),
  );
}

function deduplicatePipeline(steps: StepLikeOpts[]) {
  return aggregator([], steps);
}

function stepHasMatchingKey(key?: string) {
  return function (step: StepLikeOpts) {
    return ("key" in step) && step.key === key;
  };
}

function isDuplicateStep(step: StepLikeOpts, agg: StepLikeOpts[]) {
  return ("key" in step) &&
    agg.find(stepHasMatchingKey(step.key)) !== undefined;
}

function aggregator(
  agg: StepLikeOpts[],
  [head, ...tail]: StepLikeOpts[],
): StepLikeOpts[] {
  const isNewStep = !isDuplicateStep(head, agg);
  if (isNewStep) {
    console.warn(`found new step ${head.key}`);
  }

  const nextAgg = [
    ...agg,
    ...(isNewStep ? [head] : []),
  ];

  if (tail.length === 0) {
    return nextAgg;
  }

  return aggregator(nextAgg, tail);
}

export function inlineScript(
  docs: string | string[],
  { delimiter = "EOF", stripMargin = true, shell = "bash -e" } = {},
): string[] {
  const lineStartsWithWhitespace = /^(\s*).*$/;
  if (typeof docs === "string") {
    return inlineScript([docs], { delimiter, stripMargin, shell });
  }

  const script = docs
    .flatMap((doc) => {
      const [firstLine, ...restLines] = doc.split(/[\r\n]/);
      if (!stripMargin) {
        return [firstLine, ...restLines];
      }

      const firstLineStartsWithWhitespace = !!lineStartsWithWhitespace.exec(
        firstLine,
      );

      const lines = firstLineStartsWithWhitespace
        ? [firstLine, ...restLines]
        : restLines;

      const minimumMargin = Math.min(
        ...lines
          .filter((line) => /(\w+)/.exec(line))
          .map((line) => lineStartsWithWhitespace.exec(line))
          .filter(isPresent)
          .map((lineMatch) => lineMatch[1].length),
      );

      const trimmedFirstLine = firstLineStartsWithWhitespace
        ? firstLine.slice(minimumMargin)
        : firstLine;

      return [
        trimmedFirstLine,
        ...restLines.map((line) => line.slice(minimumMargin)),
      ];
    })
    .join("\n");

  return [
    "bash",
    "-ec",
    shell + " <<'EOF'\n" + script + "EOF",
  ];
}
