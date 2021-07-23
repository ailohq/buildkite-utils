export type StepLikeOpts = {
  key?: string;
  "if"?: string;
  dependsOn?: Dependencies | null;
};

export type Dependencies = StepLike | Dependencies[];

export type StepLike = {
  readonly key?: string;
  readonly derivedSteps: StepLikeOpts[];
};

export function flattenDependencies(deps: Dependencies): StepLike[] {
  if (Array.isArray(deps)) {
    return deps
      .flatMap(flattenDependencies)
      .reduce((acc: StepLike[], dep) => {
        if (dep.key === undefined) {
          return [...acc, dep];
        } else if (acc.find((d) => d.key === dep.key) === undefined) {
          return [...acc, dep];
        } else {
          return acc;
        }
      }, []);
  } else {
    return [deps];
  }
}
