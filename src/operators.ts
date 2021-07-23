import { isPresent } from "./deps.ts";
import { Step } from "./steps/Step.ts";
import { StepLikeOpts } from "./steps/StepLike.ts";

export const ifOnMasterOrHotfix = {
  "if":
    'build.branch == "$BUILDKITE_DEFAULT_BRANCH" || build.branch =~ /^hotfix/',
};

export const notOnMaster = {
  "if": 'build.branch != "$BUILDKITE_DEFAULT_BRANCH"',
};

export const ifOnHotfix = {
  "if": "build.branch =~ /^hotfix/",
};

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

function deduplicatePipeline(steps: StepLikeOpts[]) {
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

    if (tail.length > 0) {
      return aggregator(nextAgg, tail);
    } else {
      return nextAgg;
    }
  }

  return aggregator([], steps);
}

export function inlineBashScript(
  doc: string,
  { delimiter = "EOF", stripMargin = true } = {},
): string[] {
  const lineStartsWithWhitespace = /^(\s*).*$/;
  if (stripMargin) {
    const [firstLine, ...restLines] = doc.split(/[\r\n]/);
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

    return inlineBashScript(
      [trimmedFirstLine, ...lines.map((line) => line.slice(minimumMargin))]
        .join("\n"),
      {
        delimiter,
        stripMargin: false,
      },
    );
  }

  return [
    "bash",
    "-ec",
    "bash <<EOF\n" + doc + "EOF",
  ];
}
