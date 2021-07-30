import { isPresent } from "../deps.ts";

export type StepLikeOpts = {
  key?: string;
  "if"?: string;
  dependsOn?: Dependencies | null;
};

export type Dependencies = StepLike | undefined | null | Dependencies[];

export type StepLike = {
  readonly key?: string;
  readonly derivedSteps: StepLikeOpts[];
};

export function flattenDependencies(deps: Dependencies): StepLike[] | null {
  if (deps === null) {
    return deps;
  }

  if (Array.isArray(deps)) {
    return deps
      .map(flattenDependencies)
      .reduce((acc: StepLike[] | null, nextDeps) => {
        if (acc === null || acc === []) {
          return nextDeps;
        }

        if (nextDeps === null) {
          return acc;
        }

        const deduplicated = nextDeps.filter((dep) => {
          return dep.key === undefined ||
            acc.some((d) => d.key === dep.key);
        });

        return [...acc, ...deduplicated];
      }, []);
  }

  return [deps].filter(isPresent);
}
