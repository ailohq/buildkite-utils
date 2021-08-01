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
  const [firstDep, ...flattened] = [...flattenDependenciesImpl(deps)];

  if (firstDep === null && flattened.filter(isPresent).length === 0) {
    return null;
  }

  return [firstDep, ...flattened].filter(isPresent);
}

function* flattenDependenciesImpl(
  deps: Dependencies,
): Generator<StepLike | null> {
  if (Array.isArray(deps)) {
    for (const d of deps) {
      yield* flattenDependenciesImpl(d);
    }
  } else if (deps === undefined) {
    return;
  } else {
    yield deps;
  }
}
