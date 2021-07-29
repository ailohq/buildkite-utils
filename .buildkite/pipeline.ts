import { CommandStep } from "../src/steps/mod.ts";
import { buildPipeline, ifOnMain } from "../src/operators.ts";
import { GitTag } from "../src/plugins.ts";

const env = {
  TAG: "v1.0.$BUILDKITE_BUILD_NUMBER",
};

const lint = new CommandStep({
  label: ":tslint: Lint",
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

    echo "--- deno lint"
    deno lint
  `,
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
