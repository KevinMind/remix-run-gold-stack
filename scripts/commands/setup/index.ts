import { question, $, fs } from "zx";
import { z } from "zod";
import { logImportant, step, pkgJson, log, projectRootPath } from "../../utils";
import { join } from "path";

enum EnvKeys {
  Github = "GITHUB_ACCESS_TOKEN",
  Vercel = "VERCEL_ACCESS_TOKEN",
}

const envSchema = z.object({
  [EnvKeys.Github]: z.string().optional(),
  [EnvKeys.Vercel]: z.string().optional(),
});

const env = envSchema.parse(process.env);

async function getOrSetAccessToken(key: EnvKeys, url: string) {
  // load token from env initially
  let token = env[key];

  const tmpDirPath = join(projectRootPath, "tmp");
  const tokenPath = join(tmpDirPath, `${key}.txt`);

  const tokenFileExists = () => fs.existsSync(tokenPath);

  // load token from cache
  if (!token && tokenFileExists()) {
    token = fs.readFileSync(tokenPath, "utf-8");
  }

  // no token in env or cache, create new
  if (!token) {
    logImportant(`create a persistent access token by opening the link below`);
    log(url);

    token = await question("paste your access token here:   ");
  }

  // ensure token is cached in file
  if (!tokenFileExists()) {
    if (!fs.existsSync(tmpDirPath)) {
      fs.mkdirSync(tmpDirPath);
    }

    fs.writeFileSync(tokenPath, token, { encoding: "utf8" });
  }

  // sync final token to gitpod
  $.verbose = false;
  await $`eval $(gp env -e ${key}=${token})`;

  return {
    token,
    tokenPath,
  };
}

await step(
  "login to github",
  async () => {
    const ghToken = await getOrSetAccessToken(
      EnvKeys.Github,
      `https://github.com/settings/tokens/new?description=${pkgJson.name}-development&scopes=repo,read:packages,read:org,codespace:secrets`
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
      "https://vercel.com/account/tokens"
    );

    $.verbose = false;
    await $`vercel whoami --token ${vercelToken.token}`;

    log("vercel access token saved!");
  },
  {
    spinner: false,
  }
);
