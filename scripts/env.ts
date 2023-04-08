import { z } from "zod";
import { fs, question, $ } from "zx";

import { logImportant, log, projectRootPath } from "./utils";
import { join } from "path";

export enum EnvKeys {
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

export const env = envSchema.parse(process.env);

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

export async function getOrSetAccessToken(
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

export async function syncToGithub(token: AccessToken) {
  // sync final token to gitpod
  $.verbose = false;
  await $`gh secret set ${token.key} -b ${token.token}`;
}

export function getTokenFromPaste(url: string) {
  return async () => {
    logImportant(`create a persistent access token by opening the link below`);
    log(url);

    return await question("paste your access token here:   ");
  };
}