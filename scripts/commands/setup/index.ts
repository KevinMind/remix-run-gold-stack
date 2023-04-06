import { question, $, fs } from "zx";
import { z } from "zod";
import { logImportant, step, pkgJson, log, projectRootPath } from "../../utils";
import { join } from "path";
import invariant from 'tiny-invariant'

enum EnvKeys {
  Github = "GITHUB_ACCESS_TOKEN",
  Vercel = "VERCEL_ACCESS_TOKEN",
  VercelOrgId = 'VERCEL_ORG_ID',
  VercelProjectId = 'VERCEL_PROJECT_ID',
}

const envSchema = z.object({
  [EnvKeys.Github]: z.string().optional(),
  [EnvKeys.Vercel]: z.string().optional(),
  [EnvKeys.VercelOrgId]: z.string().optional(),
  [EnvKeys.VercelProjectId]: z.string().optional(),
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

  return {tokenPath, tmpDirPath};
}

function cacheToken(key: EnvKeys, value: string): AccessToken {
  const {tokenPath, tmpDirPath} = getTokenPath(key);

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

async function getOrSetAccessToken(key: EnvKeys, url: string, cb: (token: AccessToken) => void): Promise<AccessToken> {
  // load token from env initially
  let token = env[key];

  const {tokenPath} = getTokenPath(key);

  // load token from cache
  if (!token && tokenFileExists(tokenPath)) {
    token = fs.readFileSync(tokenPath, "utf-8");
  }

  // no token in env or cache, create new
  if (!token) {
    logImportant(`create a persistent access token by opening the link below`);
    log(url);

    token = await question("paste your access token here:   ");
  }

  // ensure token is cached in file
  return cacheToken(key, token);
}

async function syncToGitpod(token: AccessToken) {
    // sync final token to gitpod
    $.verbose = false;
    await $`eval $(gp env -e ${token.key}=${token.token})`;
}

async function syncToGithub(token: AccessToken) {
  // sync final token to gitpod
  $.verbose = false;
  await $`gh secret set ${token.key} -b ${token.token}`;
}

await step(
  "login to github",
  async () => {
    const ghToken = await getOrSetAccessToken(
      EnvKeys.Github,
      `https://github.com/settings/tokens/new?description=${pkgJson.name}-development&scopes=repo,read:packages,read:org,codespace:secrets`,
      syncToGitpod,
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
      "https://vercel.com/account/tokens",
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

await step('link vercel project', async () => {
  $.verbose = true;
  await $`vercel -t ${env.VERCEL_ACCESS_TOKEN} link`;

  const vercelProjectJsonPath = join(projectRootPath, '.vercel', 'project.json');

  invariant(fs.existsSync(vercelProjectJsonPath), `could not find ${vercelProjectJsonPath}`);

  const vercelProject = JSON.parse(fs.readFileSync(vercelProjectJsonPath, 'utf-8')) as {orgId: string; projectId: string};

  invariant(vercelProject.orgId, `unexpected error: vercel project does not contain 'orgId'`);
  invariant(vercelProject.projectId, `unexpected error: vercel project does not contain 'projectId'`);

  const orgIdToken = cacheToken(EnvKeys.VercelOrgId, vercelProject.orgId);
  await syncToGithub(orgIdToken);

  const projectIdToken = cacheToken(EnvKeys.VercelProjectId, vercelProject.projectId);
  await syncToGithub(projectIdToken);
}, {
  spinner: false,
});
