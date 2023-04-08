import { $, fs } from "zx";
import { step, pkgJson, log, projectRootPath } from "../../utils";
import { join } from "path";
import invariant from "tiny-invariant";

import {
  env,
  EnvKeys,
  getOrSetAccessToken,
  getTokenFromPaste,
  syncToGithub,
} from "../../env";

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
      await $`vercel -t ${env.VERCEL_ACCESS_TOKEN} pull`;

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
