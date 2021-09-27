import { renderKey, Step, StepOpts } from "./Step.ts";

type BuildData = {
  metadata?: string;
  environment?: Record<string, string>;
  extraEnvironment?: string[];
  message?: string;
};

type TriggerOpts<ExtraBuildData> = StepOpts<{
  label: string;
  pipeline: string;
  build?: ExtraBuildData & BuildData;
}>;

export class Trigger extends Step {
  constructor(
    {
      pipeline,
      build: {
        metadata: buildMetadata,
        environment = {},
        extraEnvironment = [],
        ...build
      } = {},
      ...opts
    }: TriggerOpts<{
      commit?: string;
      branch?: string;
    }>,
  ) {
    const key = renderKey(opts.label);
    super({
      key,
      ...opts,
      trigger: pipeline,
      build: {
        meta_data: buildMetadata,
        env: {
          ...environment,
          ...Object.fromEntries(extraEnvironment.map((e) => [e, `$${e}`])),
        },
        ...build,
      },
    });
  }
}

// deno-lint-ignore no-namespace
export namespace Trigger {
  export const fromThisCommit = (
    { build = {}, ...opts }: TriggerOpts<unknown>,
  ) => {
    return new Trigger({
      ...opts,
      build: {
        ...build,
        commit: Deno.env.get("BUILDKITE_COMMIT"),
        branch: Deno.env.get("BUILDKITE_BRANCH"),
        extraEnvironment: [
          "BUILDKITE_PULL_REQUEST",
          "BUILDKITE_PULL_REQUEST_BASE_BRANCH",
          "BUILDKITE_PULL_REQUEST_REPO",
        ],
        environment: {
          ...build.environment,
        },
      },
    });
  };
}
