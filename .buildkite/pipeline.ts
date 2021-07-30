import { CommandStep } from "../src/steps/mod.ts";
import { buildPipeline, ifOnMain } from "../src/operators.ts";
import { GitTag } from "../src/plugins.ts";

const env = {
  TAG: "v1.0.$BUILDKITE_BUILD_NUMBER",
};

const lint = DenoCommandStep({
  label: ":tslint: Lint",
  permitRetryOnPassed: false,
  command: `
    echo "--- deno lint"
    deno lint
  `,
});

const test = DenoCommandStep({
  label: ":test_tube: Test",
  permitRetryOnPassed: false,
  command: `
    echo "--- deno test"
    deno test
  `,
});

const tagRelease = new CommandStep({
  ...ifOnMain,
  label: ":git: Tag Release",
  command: `echo Create release ${env.TAG}`,
  permitRetryOnPassed: false,
  dependsOn: [lint, test],
  plugins: [GitTag({ release: true, version: env.TAG })],
});

buildPipeline({
  env,
  pipeline: [tagRelease],
});

function DenoCommandStep(
  { command, ...opts }: ConstructorParameters<typeof CommandStep>[0],
) {
  return new CommandStep({
    ...opts,
    command: `
      install_deno() {
          echo "--- setup deno runtime"
          curl -fsSL https://deno.land/x/install/install.sh | sh > /dev/null
      }

      export DENO_INSTALL="$HOME/.deno"
      export PATH="$PATH:$DENO_INSTALL/bin"

      if ! which deno > /dev/null; then
          install_deno
      fi

      ${command}
    `,
  });
}
