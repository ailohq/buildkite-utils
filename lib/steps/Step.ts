import { isPresent, punycode } from "../deps.ts";
import { flattenDependencies, StepLike, StepLikeOpts } from "./StepLike.ts";

export type StepOpts<T> = StepLikeOpts & { key?: string } & T;
export class Step implements StepLike {
  constructor(readonly opts: StepOpts<Record<string, unknown>>) {
  }

  get key(): string | undefined {
    return this.opts.key;
  }

  get derivedSteps() {
    const { dependsOn, ...opts } = this.opts;
    const flatDeps = flattenDependencies(dependsOn ?? []);

    const stepDetail = {
      key: this.key,
      ...opts,
      // deno-lint-ignore camelcase
      depends_on: flatDeps && flatDeps
        .map((step) => step.key)
        .filter(isPresent),
    };

    return [
      ...(flatDeps?.flatMap((step) => step.derivedSteps) ?? []),
      stepDetail,
    ];
  }
}

export function renderKey(rawKey: string) {
  return punycode.encode(
    rawKey.replaceAll(/\s/g, "_")
      .replaceAll(/[\[\]]/g, ""),
  );
}
