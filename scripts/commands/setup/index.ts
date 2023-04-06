import { question, $, fs } from "zx";
import { z } from "zod";
import { logImportant, step, pkgJson, log, projectRootPath } from "../../utils";
import { join } from "path";
import choice from "cli-select";
import invariant from "tiny-invariant";

enum EnvKeys {
  Github = "GITHUB_ACCESS_TOKEN",
  Vercel = "VERCEL_ACCESS_TOKEN",
  VercelOrgId = "VERCEL_ORG_ID",
  VercelProjectId = "VERCEL_PROJECT_ID",
  PlanetScale = "PLANETSCALE_SERVICE_TOKEN",
  PlanetScaleTokenId = "PLANETSCALE_SERVICE_TOKEN_ID",
  PlanetScaleOrg = "PLANETSCALE_ORG",
  PlanetScaleDatabase = "PLANETSSCALE_DATABASE",
}

const envSchema = z.object({
  [EnvKeys.Github]: z.string().optional(),
  [EnvKeys.Vercel]: z.string().optional(),
  [EnvKeys.VercelOrgId]: z.string().optional(),
  [EnvKeys.VercelProjectId]: z.string().optional(),
  [EnvKeys.PlanetScale]: z.string().optional(),
  [EnvKeys.PlanetScaleTokenId]: z.string().optional(),
  [EnvKeys.PlanetScaleOrg]: z.string().optional(),
  [EnvKeys.PlanetScaleDatabase]: z.string().optional(),
});

const env = envSchema.parse(process.env);

interface AccessToken {
  key: string;
  token: string;
  tokenPath: string;
}

const tokenFileExists = (tokenPath: string) => fs.existsSync(tokenPath);

function getTokenPath(key: string) {
  const tmpDirPath = join(projectRootPath, "tmp");
  const tokenPath = join(tmpDirPath, `${key}.txt`);

  return { tokenPath, tmpDirPath };
}

function cacheToken(key: EnvKeys, value: string): AccessToken {
  const { tokenPath, tmpDirPath } = getTokenPath(key);

  if (!tokenFileExists(tokenPath)) {
    if (!fs.existsSync(tmpDirPath)) {
      fs.mkdirSync(tmpDirPath);
    }

    fs.writeFileSync(tokenPath, value, { encoding: "utf8" });
  }

  return {
    tokenPath,
    token: value,
    key,
  };
}

function getTokenFromCache(key: EnvKeys) {
  let token = env[key];

  const { tokenPath } = getTokenPath(key);

  // load token from cache
  if (!token && tokenFileExists(tokenPath)) {
    token = fs.readFileSync(tokenPath, "utf-8");
  }

  return token;
}

async function getOrSetAccessToken(
  key: EnvKeys,
  onCreate: () => Promise<string>,
  onCached?: (token: AccessToken) => void
): Promise<AccessToken> {
  // load token from env initially
  let token = getTokenFromCache(key);

  // no token in env or cache, create new
  if (!token) {
    token = await onCreate();
  }

  // ensure token is cached in file
  const cache = cacheToken(key, token);

  // sync to gitpod and environment
  $.verbose = false;
  await $`eval $(gp env -e ${key}=${token})`;

  // sync to aditional storage if needed
  onCached?.(cache);

  return cache;
}

async function syncToGithub(token: AccessToken) {
  // sync final token to gitpod
  $.verbose = false;
  await $`gh secret set ${token.key} -b ${token.token}`;
}

function getTokenFromPaste(url: string) {
  return async () => {
    logImportant(`create a persistent access token by opening the link below`);
    log(url);

    return await question("paste your access token here:   ");
  };
}

await step(
  "login to github",
  async () => {
    const ghToken = await getOrSetAccessToken(
      EnvKeys.Github,
      getTokenFromPaste(
        `https://github.com/settings/tokens/new?description=${pkgJson.name}-development&scopes=repo,read:packages,read:org,codespace:secrets`
      )
    );

    await $`gh auth login --with-token < ${ghToken.tokenPath}`;

    log("github access token saved!");
  },
  {
    spinner: false,
  }
);

await step(
  "login to vercel",
  async () => {
    const vercelToken = await getOrSetAccessToken(
      EnvKeys.Vercel,
      getTokenFromPaste("https://vercel.com/account/tokens"),
      syncToGithub
    );

    $.verbose = false;
    await $`vercel whoami --token ${vercelToken.token}`;

    log("vercel access token saved!");
  },
  {
    spinner: false,
  }
);

await step(
  "link vercel project",
  async () => {
    interface VercelProject {
      orgId: string;
      projectId: string;
    }

    async function loadFromVercelProject(): Promise<VercelProject> {
      const vercelProjectJsonPath = join(
        projectRootPath,
        ".vercel",
        "project.json"
      );

      if (fs.existsSync(vercelProjectJsonPath)) {
        const vercelProject = JSON.parse(
          fs.readFileSync(vercelProjectJsonPath, "utf-8")
        ) as VercelProject;

        invariant(
          vercelProject.orgId,
          `unexpected error: vercel project does not contain 'orgId'`
        );
        invariant(
          vercelProject.projectId,
          `unexpected error: vercel project does not contain 'projectId'`
        );

        return vercelProject;
      }

      $.verbose = true;
      await $`vercel -t ${env.VERCEL_ACCESS_TOKEN} link`;

      return loadFromVercelProject();
    }

    const project = await loadFromVercelProject();

    await getOrSetAccessToken(
      EnvKeys.VercelProjectId,
      async () => project.projectId,
      syncToGithub
    );

    await getOrSetAccessToken(
      EnvKeys.VercelOrgId,
      async () => project.orgId,
      syncToGithub
    );
  },
  {
    spinner: false,
  }
);

await step(
  "login to planetscale",
  async () => {
    const planetscaleToken = await getOrSetAccessToken(
      EnvKeys.PlanetScale,
      getTokenFromPaste(
        "https://app.planetscale.com/kevin-mind/settings/service-tokens"
      ),
      syncToGithub
    );

    const planetScaleTokenId = await getOrSetAccessToken(
      EnvKeys.PlanetScaleTokenId,
      async () => question("paste your access token id here:   "),
      syncToGithub
    );

    async function pscaleExec(command: string) {
      $.verbose = true;
      // @ts-ignore
      return await $([
        [
          "pscale",
          command,
          `--service-token ${planetscaleToken.token}`,
          `--service-token-id ${planetScaleTokenId.token}`,
        ].join(" "),
      ]);
    }

    const planetScaleOrg = await getOrSetAccessToken(
      EnvKeys.PlanetScaleOrg,
      async () => {
        log("select a github organization to associate planetscale with");
        const orgs = JSON.parse(
          (await pscaleExec("org list --format json")).toString()
        ) as { name: string }[];

        const selectedOrg = await choice<string>({
          values: orgs.map((org) => org.name),
        });

        return selectedOrg.value;
      },
      syncToGithub
    );

    await getOrSetAccessToken(
      EnvKeys.PlanetScaleDatabase,
      async () => {
        return pkgJson.name;
      },
      syncToGithub
    );
  },
  {
    spinner: false,
  }
);

await step("prisma generate", async () => {
  await $`pnpm exec prisma generate`;
});

await step("prisma migrate", async () => {
  await $`pnpm exec prisma db push`;
});

await step("db seed", async () => {
  await $`pnpm exec prisma db seed`;
});
