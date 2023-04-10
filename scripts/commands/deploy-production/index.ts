import { $ } from "zx";

import { step, log, pkgJson, withTmpPath } from "../../utils";
import { SecretsManager, SecretKeys } from "../../secrets";

const dbName = pkgJson.name;

const secrets = new SecretsManager();

const pscaleServiceToken = secrets.readSecret(SecretKeys.PlanetScale);
const pscaleServiceTokenId = secrets.readSecret(SecretKeys.PlanetScaleTokenId);
const pscaleOrg = secrets.readSecret(SecretKeys.PlanetScaleOrg);
const vercelToken = secrets.readSecret(SecretKeys.Vercel);
const vercelOrgId = secrets.readSecret(SecretKeys.VercelOrgId);
const vercelProjectId = secrets.readSecret(SecretKeys.VercelProjectId);

$.verbose = true;

interface Password {
  id: string;
  name: string;
  access_host_url: string;
  username: string;
  database_branch: {
    name: string;
  };
  plain_text: string;
}

const connectionString = await step<string>(
  "get connection string",
  async () => {
    const passwordName = "prisma";

    const formatPassword = (password: Password) =>
      `mysql://${password.username}:${password.plain_text}@${password.access_host_url}/${dbName}?sslaccept=strict`;

    const passwords = JSON.parse(
      (
        await $`pscale password list ${dbName} main --format json --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId} --org ${pscaleOrg}`
      ).toString()
    ) as Password[];

    const existingPassword = passwords.find((password) => {
      return password.name === passwordName;
    });

    if (existingPassword) {
      await $`pscale password delete ${dbName} main ${existingPassword.id} --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId} --org ${pscaleOrg} --force`;
    }

    const newPassword = JSON.parse(
      (
        await $`pscale password create ${dbName} main ${passwordName} --format json --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId} --org ${pscaleOrg}`
      ).toString()
    ) as Password;

    return formatPassword(newPassword);
  }
);

await step("deploy production", async () => {
  log(`deploying project: ${vercelProjectId} org: ${vercelOrgId}`);
  $.verbose = true;

  await $`vercel pull --yes --environment=production -t ${vercelToken} --scope ${vercelOrgId}`;

  await withTmpPath(connectionString, async (dbUrlPath) => {
    try {
      await $`vercel env rm DATABASE_URL production -t ${vercelToken} --scope ${vercelOrgId} --yes`;
    } catch {}

    await $`vercel env add DATABASE_URL production < ${dbUrlPath} -t ${vercelToken} --scope ${vercelOrgId} --yes`;
  });

  await $`vercel deploy -t ${vercelToken} --scope ${vercelOrgId} -e DATABASE_URL=${connectionString} --prod`;
  log("deploy successful!");
});
