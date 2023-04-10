import { question, $, fs } from "zx";
import {
  step,
  pkgJson,
  log,
  projectRootPath,
  logImportant,
  withTmpPath,
} from "../../utils";
import { join } from "path";
import choice from "cli-select";
import invariant from "tiny-invariant";

import { pscaleExec } from "../../services/pscale";
import { SecretsManager, SecretKeys, SECRET_PASSWORD } from "../../secrets";

function getTokenFromPaste(url: string) {
  return async () => {
    logImportant(`create a persistent access token by opening the link below`);
    log(url);

    return await question("paste your access token here:   ");
  };
}

const secrets = new SecretsManager();

const secretPassword = secrets.getPassword();

await step(
  "login to github",
  async () => {
    const ghToken = await secrets.requireSecret(
      SecretKeys.Github,
      getTokenFromPaste(
        `https://github.com/settings/tokens/new?description=${pkgJson.name}-development&scopes=repo,read:packages,read:org,codespace:secrets`
      )
    );

    await withTmpPath(ghToken, async (tmpTokenPath) => {
      $.verbose = false;
      await $`gh auth login --with-token < ${tmpTokenPath}`;
    });

    log("github access token saved!");
  },
  {
    spinner: false,
  }
);

await step("save secret to github", async () => {
  $.verbose = false;
  await $`gh secret set ${SECRET_PASSWORD} -b ${secretPassword}`;
});

const vercelToken = await step(
  "login to vercel",
  async () => {
    const vercelToken = await secrets.requireSecret(
      SecretKeys.Vercel,
      getTokenFromPaste("https://vercel.com/account/tokens")
    );

    $.verbose = false;
    await $`vercel whoami --token ${vercelToken}`;

    log("vercel access token saved!");

    return vercelToken;
  },
  {
    spinner: false,
  }
);

const { orgId } = await step(
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
      await $`vercel -t ${vercelToken} link`;
      await $`vercel -t ${vercelToken} pull`;

      return loadFromVercelProject();
    }

    const projectId = await secrets.requireSecret(
      SecretKeys.VercelProjectId,
      async () => {
        const project = await loadFromVercelProject();

        return project.projectId;
      }
    );

    const orgId = await secrets.requireSecret(
      SecretKeys.VercelOrgId,
      async () => {
        const project = await loadFromVercelProject();

        return project.orgId;
      }
    );

    return {
      projectId,
      orgId,
    };
  },
  {
    spinner: false,
  }
);

await step("saving secret to vercel", async () => {
  await withTmpPath(secretPassword, async (tmpSecretPath) => {
    $.verbose = false;
    for await (let environment of ["production", "preview", "development"]) {
      const existing = (
        await $`vercel env ls ${environment}  -t ${vercelToken} --scope ${orgId} --yes`
      )
        .toString()
        .includes(SECRET_PASSWORD);

      if (!existing) {
        await $`vercel env add ${SECRET_PASSWORD} ${environment} < ${tmpSecretPath} -t ${vercelToken} --scope ${orgId} --yes `;
      }
    }
  });
});

await step(
  "login to planetscale",
  async () => {
    const planetscaleToken = await secrets.requireSecret(
      SecretKeys.PlanetScale,
      getTokenFromPaste(
        "https://app.planetscale.com/kevin-mind/settings/service-tokens"
      )
    );

    const planetScaleTokenId = await secrets.requireSecret(
      SecretKeys.PlanetScaleTokenId,
      async () => question("paste your access token id here:   ")
    );

    await secrets.requireSecret(SecretKeys.PlanetScaleOrg, async () => {
      log("select a github organization to associate planetscale with");
      const orgs = JSON.parse(
        (
          await pscaleExec(
            "org list --format json",
            planetscaleToken,
            planetScaleTokenId
          )
        ).toString()
      ) as { name: string }[];

      const selectedOrg = await choice<string>({
        values: orgs.map((org) => org.name),
      });

      return selectedOrg.value;
    });

    await secrets.requireSecret(SecretKeys.PlanetScaleDatabase, async () => {
      return pkgJson.name;
    });
  },
  {
    spinner: false,
  }
);
