type Paths = string | string[];

type S3BucketConfiguration = {
  profile?: string;
  class?: string;
  args?: string;
};

export function Cache(
  paths: Paths,
  { id = "$BUILDKITE_PIPELINE_NAME", compress = false, ...args }: {
    id?: string;
    key: string;
    compress?: boolean;
    s3?: S3BucketConfiguration;
    "restore-keys"?: string[];
  },
) {
  return {
    "gencer/cache#v2.4.8": {
      ...args,
      compress,
      id,
      backend: "s3",
      s3: {
        bucket: "ailo-buildkite-cache",
      },
      paths,
    },
  };
}

export function GitTag(opts: { release?: boolean; version?: string }) {
  return { "ailohq/git-tag#v1.0.13": opts };
}

export function GithubDeploy(opts: { environment: string }) {
  return { "ailohq/github-deployment#v1.0.8": opts };
}

export type DockerLoginOptions = { username?: string; passwordEnv?: string };
export function DockerLogin(opts?: DockerLoginOptions) {
  return {
    "docker-login#v2.0.1": {
      username: opts?.username ?? "${DOCKER_USERNAME}",
      "password-env": opts?.passwordEnv ?? "DOCKER_PASSWORD",
    },
  };
}

export function AwsAssumeRole(opts: { roleEnv: string; region?: string }) {
  return {
    "cultureamp/aws-assume-role#v0.1.0": {
      role: `$${opts.roleEnv}`,
      region: opts.region ?? "ap-southeast-2",
    },
  };
}

export const Compose = {
  Publish: (props: { config: string; build: string; push: string }) =>
    Compose._raw(props),

  Run: (props: { config: string; run: string }) => Compose._raw(props),

  _raw: (props: Record<string, unknown>) => ({
    "docker-compose#v3.8.0": props,
  }),
};
