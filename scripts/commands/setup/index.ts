import { question, $, fs } from "zx";
import { step, pkgJson, log, projectRootPath } from "../../utils";
import { join } from "path";
import choice from "cli-select";
import invariant from "tiny-invariant";

import {
  env,
  EnvKeys,
  getOrSetAccessToken,
  getTokenFromPaste,
  syncToGithub,
} from "../../env";
import { pscaleExec } from "../../services/pscale";

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

    await getOrSetAccessToken(
      EnvKeys.PlanetScaleOrg,
      async () => {
        log("select a github organization to associate planetscale with");
        const orgs = JSON.parse(
          (
            await pscaleExec(
              "org list --format json",
              planetscaleToken.token,
              planetScaleTokenId.token
            )
          ).toString()
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
