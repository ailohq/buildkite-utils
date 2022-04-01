import { hasPresentKey } from "../deps.ts";
import { renderKey, Step, StepOpts } from "./Step.ts";
import { Dependencies, flattenDependencies } from "./StepLike.ts";

type Paths = string | string[];

export type CommandStepOpts<Command> = StepOpts<{
  label: string;
  command?: Command;
  artifacts?: {
    upload?: Paths;
    download?: Paths;
  };
  plugins?: unknown[];
  environment?: Record<string, string>;
  permitRetryOnPassed?: boolean;
  concurrency?: number;
  concurrencyGroup?: string;
  concurrencyMethod?: string;
}>;

export class CommandStep<Command = string> extends Step {
  readonly artifacts;

  constructor(
    {
      artifacts,
      plugins,
      concurrency,
      permitRetryOnPassed = true,
      environment = {},
      dependsOn,
      ...opts
    }: CommandStepOpts<Command>,
  ) {
    const key = renderKey(opts.label);

    if (artifacts?.download) {
      console.warn(
        `A step has explicitly specified artifacts to download; prefer to rely on implicit downloads of artifacts from dependencies.\nStep: ${opts.label}\nArtifacts: ${artifacts.download}`,
      );
    }

    const dependencyArtifacts = resolveDependsArtifacts(dependsOn);
    const artifactPlugin = !artifacts ? [] : [
      artifact({
        upload: artifacts.upload,
        download: artifacts.download,
      }),
    ];

    const concurrencyInfo = concurrency === undefined ? {} : {
      concurrency,
      concurrency_group: opts.concurrencyGroup ?? `\${BUILDKITE_PIPELINE_NAME}-${key}`,
    };

    const permitRetry = (permitRetryOnPassed === false)
      ? {}
      : { retry: { manual: { permit_on_passed: true } } };

    if(opts.concurrencyGroup)
    {
      concurrencyInfo.concurrency_group = opts.concurrencyGroup;
      delete opts['concurrencyGroup'];
    }

    if(opts.concurrencyMethod)
    { // @ts-ignore
        concurrencyInfo.concurrency_method = opts.concurrencyMethod;
        delete opts['concurrencyMethod'];
    }
    super({
      key,
      dependsOn,
      ...opts,
      ...concurrencyInfo,
      ...permitRetry,
      env: environment,
      plugins: (plugins || artifacts)
        ? [...(plugins || []), ...artifactPlugin, ...dependencyArtifacts]
        : undefined,
    });

    this.artifacts = artifacts?.upload;
  }
}

function resolveDependsArtifacts(dependencies: Dependencies) {
  const depsWithArtifacts = flattenDependencies(dependencies)
    ?.filter((step) => step instanceof CommandStep)
    ?.filter(hasPresentKey("artifacts"))
    ?.flatMap((step) => (step as CommandStep)) ??
    [];

  return depsWithArtifacts.map((step) =>
    artifact({
      step: step.key,
      download: step.artifacts,
    })
  );
}

type ArtifactDefinition = {
  upload?: Paths;
  download?: Paths;
} | {
  step: string;
  download: Paths;
};

function artifact(props: ArtifactDefinition) {
  return {
    "artifacts#v1.3.0": props,
  };
}
