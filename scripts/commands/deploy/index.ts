import { $, ProcessOutput } from "zx";

import { step, log, pkgJson, withTmpPath } from "../../utils";
import { SecretsManager, SecretKeys } from "../../secrets";

const dbName = pkgJson.name;

const secrets = new SecretsManager();

const pscaleServiceToken = secrets.readSecret(SecretKeys.PlanetScale);
const pscaleServiceTokenId = secrets.readSecret(SecretKeys.PlanetScaleTokenId);
const pscaleOrg = secrets.readSecret(SecretKeys.PlanetScaleOrg);
const vercelToken = secrets.readSecret(SecretKeys.Vercel);
const vercelOrgId = secrets.readSecret(SecretKeys.VercelOrgId);

const branch = (await $`git rev-parse --abbrev-ref HEAD`).toString().trim();

const environment = branch !== 'main' ? 'preview' : 'production';

const isProd = environment === 'production';
const isPreview = environment === 'preview';

$.verbose = false;

isPreview && await step("deploy db branch", async () => {
  try {
    await $`pscale branch show ${dbName} ${branch} --format json --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId} --org ${pscaleOrg}`;
    log(`found branch ${branch}`);
  } catch (error) {
    if (
      error instanceof ProcessOutput &&
      error.stderr.includes("does not exist in database")
    ) {
      await step("creating branch", async () => {
        return await $`pscale branch create ${dbName} ${branch} --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId} --org ${pscaleOrg} --wait`;
      });
    } else {
      throw error;
    }
  }
});

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
        await $`pscale password list ${dbName} ${branch} --format json --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId} --org ${pscaleOrg}`
      ).toString()
    ) as Password[];

    const existingPassword = passwords.find((password) => {
      return password.name === passwordName;
    });

    if (existingPassword) {
      await $`pscale password delete ${dbName} ${branch} ${existingPassword.id} --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId} --org ${pscaleOrg} --force`;
    }

    const newPassword = JSON.parse(
      (
        await $`pscale password create ${dbName} ${branch} ${passwordName} --format json --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId} --org ${pscaleOrg}`
      ).toString()
    ) as Password;

    return formatPassword(newPassword);
  }
);

await step(`deploy ${environment}`, async () => {
  $.verbose = true;

  await $`vercel pull --yes --environment=${environment} -t ${vercelToken} --scope ${vercelOrgId}`;

  const DATABASE_URL = 'DATABASE_URL';

  await withTmpPath(connectionString, async (dbUrlPath) => {
    try {
      await $`vercel env rm ${DATABASE_URL} ${environment} ${branch} -t ${vercelToken} --scope ${vercelOrgId} --yes`;
    } catch {}

    await $`vercel env add ${DATABASE_URL} ${environment} ${branch} < ${dbUrlPath} -t ${vercelToken} --scope ${vercelOrgId} --yes`;
  });

  $.verbose = true;
  await $`vercel deploy -t ${vercelToken} --scope ${vercelOrgId} -e ${DATABASE_URL}=${connectionString} ${isProd ? '--prod' : ''}`;
  log("deploy successful!");
});
