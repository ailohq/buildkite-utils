import { flattenDependencies, StepLike, StepLikeOpts } from "./StepLike.ts";

export type StepOpts<T> = StepLikeOpts & T;
export class Step implements StepLike {
  readonly key?: string;
  readonly derivedSteps: StepLikeOpts[];

  constructor({ dependsOn, ...opts }: StepOpts<Record<string, unknown>>) {
    // this.dependsOn = dependsOn
    this.key = ("key" in opts)
      ? opts.key as string
      : ("label" in opts)
      ? opts.label as string
      : ("block" in opts)
      ? opts.block as string
      : undefined;

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
      stepDetail,
      ...flatDeps.flatMap((step) => step.derivedSteps),
    ];
  }
}
