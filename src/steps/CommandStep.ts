import { Step, StepOpts } from "./Step.ts";

type Paths = string | string[];

type ConcurrencyDetail = {
  concurrency?: undefined;
} | {
  concurrency: number;
  concurrency_group: string;
};

export type CommandStepOpts<Command> = StepOpts<
  & ConcurrencyDetail
  & {
    label: string;
    command?: Command;
    artifacts?: {
      upload?: Paths;
      download?: Paths;
    };
    plugins?: unknown[];
    env?: Record<string, string>;
    permitRetryOnPassed?: boolean;
  }
>;

export class CommandStep<Command = string> extends Step {
  constructor(
    { artifacts, plugins, permitRetryOnPassed = true, ...opts }:
      CommandStepOpts<Command>,
  ) {
    const artifactPlugin = !artifacts ? [] : [{
      "artifacts#v1.3.0": {
        upload: artifacts.upload,
        download: artifacts.download,
      },
    }];

    const permitRetry = (permitRetryOnPassed === false)
      ? {}
      : { retry: { manual: { permit_on_passed: true } } };

    super({
      ...opts,
      ...permitRetry,
      plugins: (plugins || artifacts)
        ? [...(plugins || []), ...artifactPlugin]
        : undefined,
    });
  }
}
