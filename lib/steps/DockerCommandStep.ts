import { CommandStep, CommandStepOpts } from "./CommandStep.ts";
import { DockerLogin, DockerLoginOptions } from "../plugins.ts";

export class DockerCommandStep extends CommandStep<undefined> {
  constructor({
    image,
    entrypoint,
    command,
    plugins: providedPlugins,
    propagateEnvironment,
    extraEnvironment,
    volumes,
    dockerLogin: dockerLoginOptions,
    ...opts
  }: CommandStepOpts<string | string[]> & {
    image: string;
    entrypoint?: string | string[];
    propagateEnvironment?: boolean;
    extraEnvironment?: string[];
    volumes?: Record<string, string>;
    dockerLogin?: DockerLoginOptions;
  }) {
    super({
      ...opts,
      command: undefined,
      plugins: [
        DockerLogin(dockerLoginOptions),
        ...(providedPlugins ?? []),
        {
          "docker#v3.8.0": {
            image,
            entrypoint,
            command,
            "propagate-environment": propagateEnvironment ?? true,
            environment: extraEnvironment,
            volumes: Object
              .entries(volumes ?? {})
              .map(([k, v]) => `${k}:${v}`),
          },
        },
      ],
    });
  }
}