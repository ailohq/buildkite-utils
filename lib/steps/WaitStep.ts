import { Step, StepOpts } from "./Step.ts";

export class WaitStep extends Step {
  constructor(opts?: StepOpts<never>) {
    super({
      ...(opts ?? {}),
      wait: null,
    });
  }
}
