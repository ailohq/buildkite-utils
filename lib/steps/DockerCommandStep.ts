import { CommandStep, CommandStepOpts } from "./CommandStep.ts";
import { DockerLogin, DockerLoginOptions } from "../plugins.ts";

const DOCKER_BINARY_PATH = "/usr/bin/docker";

export class DockerCommandStep extends CommandStep<undefined> {
  constructor({
    image,
    entrypoint,
    command,
    workdir,
    volumes,
    alwaysPull,
    extraEnvironment = [],
    dockerLogin: dockerLoginOptions,
    plugins: providedPlugins = [],
    propagateEnvironment = true,
    mountDocker = true,
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
    mountDocker?: boolean;
    alwaysPull?: boolean;
  }) {
    const hostDockerVolumes = mountDocker
      ? {
        "/tmp": "/tmp",
        "/var/run/docker.sock": "/var/run/docker.sock",
        [DOCKER_BINARY_PATH]: DOCKER_BINARY_PATH,
      }
      : {};

    const hostDockerEnv = mountDocker ? ["DOCKER_CONFIG"] : [];

    super({
      ...opts,
      command: undefined,
      environment: {
        DOCKER_BUILDKIT: "1",
        ...opts.environment,
      },
      plugins: [
        DockerLogin(dockerLoginOptions),
        ...providedPlugins,
        {
          "docker#v3.8.0": {
            image,
            entrypoint,
            command,
            workdir,
            "always-pull": alwaysPull,
            "propagate-environment": propagateEnvironment,
            environment: [
              ...extraEnvironment,
              ...hostDockerEnv,
            ],
            volumes: Object
              .entries({
                ...hostDockerVolumes,
                ...volumes,
              })
              .map(([k, v]) => `${k}:${v}`),
          },
        },
      ],
    });
  }
}
