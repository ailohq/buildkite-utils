type Paths = string | string[];

export function Cache(paths: Paths, { key }: { key: string }) {
  return {
    "gencer/cache#v2.4.8": {
      backend: "s3",
      s3: {
        bucket: "ailo-buildkite-cache",
      },
      key,
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
