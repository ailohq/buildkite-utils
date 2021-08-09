import { punycode } from "../deps.ts";
import { renderKey, Step, StepOpts } from "./Step.ts";

type TextField = {
  text: string;
};

type InputField = {
  select: string;
  options: {
    label: string;
    value: string;
  }[];
  multiple?: boolean;
};

type BlockField = (TextField | InputField) & {
  hint?: string;
  required?: boolean;
  default?: string;
};

function buildBlockKey(field: BlockField) {
  return punycode.encode(
    "text" in field ? field.text : field.select,
  );
}

export class BlockStep extends Step {
  constructor(
    opts: StepOpts<{ block: string; prompt?: string; fields?: BlockField[] }>,
  ) {
    const key = renderKey(opts.block);

    const fields = opts.fields?.map((field) => ({
      key: buildBlockKey(field),
      ...field,
    }));

    super({
      key,
      dependsOn: null,
      ...opts,
      fields,
    });
  }
}
