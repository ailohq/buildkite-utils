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
      steps: renderSteps(pipeline),
    }),
  );
}
export function renderSteps(steps: Step | Step[]) {
  if (!Array.isArray(steps)) {
    return [steps];
  }
  return deduplicatePipeline(steps.flatMap((step) => step.derivedSteps));
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

  return steps.reduce<StepLikeOpts[]>((agg, head) => {
    const isNewStep = !isDuplicateStep(head, agg);
    if (isNewStep) {
      console.warn(`found new step ${head.key}`);
    }

    return [
      ...agg,
      ...(isNewStep ? [head] : []),
    ];
  }, []);
}

export function inlineScript(
  docs: string | string[],
  { delimiter = "EOF", stripMargin = true, shell = "bash -e", nested = true } =
    {},
): string[] {
  const lineStartsWithWhitespace = /^(\s*).*$/;
  if (typeof docs === "string") {
    return inlineScript([docs], { delimiter, stripMargin, shell, nested });
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

  const parentShell = nested ? ["sh", "-ec"] : [];

  return [
    ...parentShell,
    `${shell} <<'${delimiter}'\n${script}${delimiter}`,
  ];
}
