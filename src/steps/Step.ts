import { punycode } from "../deps.ts";
import { flattenDependencies, StepLike, StepLikeOpts } from "./StepLike.ts";

export type StepOpts<T> = StepLikeOpts & { key?: string } & T;
export class Step implements StepLike {
  readonly key?: string;
  readonly derivedSteps: StepLikeOpts[];

  constructor({ dependsOn, ...opts }: StepOpts<Record<string, unknown>>) {
    this.key = opts.key;

    const flatDeps = flattenDependencies(dependsOn ?? []);

    const stepDetail = {
      key: this.key,
      ...opts,
      // deno-lint-ignore camelcase
      depends_on: flatDeps
        .map((step) => step.key)
        .filter(Boolean),
    };

    this.derivedSteps = [
      ...flatDeps.flatMap((step) => step.derivedSteps),
      stepDetail,
    ];
  }
}

export function renderKey(rawKey: string) {
  return punycode.encode(rawKey.replaceAll(/\s/g, "_"));
}
