import { CommandStep } from "../src/steps/mod.ts";
import { buildPipeline, ifOnMain } from "../src/operators.ts";
import { GitTag } from "../src/plugins.ts";

const env = {
  TAG: "v1.0.$BUILDKITE_BUILD_NUMBER",
};

const lint = new CommandStep({
  label: ":tslint: Lint",
  command: "deno lint ",
  permitRetryOnPassed: false,
});

const tagRelease = new CommandStep({
  label: ":git: Tag Release",
  command: `echo Create release ${env.TAG}`,
  ...ifOnMain,
  dependsOn: lint,
  plugins: [
    GitTag({
      release: true,
      version: env.TAG,
    }),
  ],
  permitRetryOnPassed: false,
});

buildPipeline({
  env,
  pipeline: [tagRelease],
});
