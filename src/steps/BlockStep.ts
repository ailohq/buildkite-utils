import { Step, StepOpts } from "./Step.ts";

export class BlockStep extends Step {
  constructor(opts: StepOpts<{ block: string }>) {
    super({
      dependsOn: null,
      ...opts,
    });
  }
}
