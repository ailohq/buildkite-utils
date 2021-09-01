import { CommandStep, CommandStepOpts } from "./CommandStep.ts";
import { DockerLogin, DockerLoginOptions } from "../plugins.ts";

export class DockerCommandStep extends CommandStep<undefined> {
  constructor({
    image,
    entrypoint,
    command,
    plugins: providedPlugins,
    mountCheckout,
    propagateEnvironment,
    workdir,
    extraEnvironment,
    volumes,
    dockerLogin: dockerLoginOptions,
    ...opts
  }: CommandStepOpts<string | string[]> & {
    image: string;
    entrypoint?: string | string[];
    mountCheckout?: boolean;
    propagateEnvironment?: boolean;
    workdir?: string;
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
            workdir,
            "mount-checkout": mountCheckout ?? true,
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
