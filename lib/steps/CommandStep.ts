import { renderKey, Step, StepOpts } from "./Step.ts";

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
}>;

export class CommandStep<Command = string> extends Step {
  constructor(
    {
      artifacts,
      plugins,
      concurrency,
      permitRetryOnPassed = true,
      environment = {},
      ...opts
    }: CommandStepOpts<Command>,
  ) {
    const key = renderKey(opts.label);

    const artifactPlugin = !artifacts ? [] : [{
      "artifacts#v1.3.0": {
        upload: artifacts.upload,
        download: artifacts.download,
      },
    }];

    const concurrencyInfo = concurrency === undefined ? {} : {
      concurrency,
      concurrency_group: `\${BUILDKITE_PIPELINE_NAME}-${key}`,
    };

    const permitRetry = (permitRetryOnPassed === false)
      ? {}
      : { retry: { manual: { permit_on_passed: true } } };

    super({
      key,
      ...opts,
      ...concurrencyInfo,
      ...permitRetry,
      env: environment,
      plugins: (plugins || artifacts)
        ? [...(plugins || []), ...artifactPlugin]
        : undefined,
    });
  }
}
