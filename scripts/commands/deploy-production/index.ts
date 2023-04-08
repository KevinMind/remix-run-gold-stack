import { $, fs } from "zx";
import invariant from "tiny-invariant";

import { step, log, pkgJson, projectRootPath } from "../../utils";
import { env } from "../../env";
import { join } from "path";

const dbName = pkgJson.name;

let pscaleServiceToken: string;
let pscaleServiceTokenId: string;
let pscaleOrg: string;
let vercelToken: string;
let vercelOrgId: string;
let vercelProjectId: string;

await step("validate env", async () => {
  invariant(env.PLANETSCALE_ORG);
  invariant(env.PLANETSCALE_SERVICE_TOKEN);
  invariant(env.PLANETSCALE_SERVICE_TOKEN_ID);
  invariant(env.VERCEL_ACCESS_TOKEN);
  invariant(env.VERCEL_ORG_ID);
  invariant(env.VERCEL_PROJECT_ID);

  vercelOrgId = env.VERCEL_ORG_ID;
  vercelProjectId = env.VERCEL_PROJECT_ID;
  vercelToken = env.VERCEL_ACCESS_TOKEN;
  pscaleServiceToken = env.PLANETSCALE_SERVICE_TOKEN;
  pscaleServiceTokenId = env.PLANETSCALE_SERVICE_TOKEN_ID;
  pscaleOrg = env.PLANETSCALE_ORG;
});

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

  const dbUrlPath = join(projectRootPath, "db_url.txt");

  log(`deploying project: ${vercelProjectId} org: ${vercelOrgId}`);
  $.verbose = true;

  await $`vercel pull --yes --environment=production -t ${vercelToken} --scope ${vercelOrgId}`;

  await fs.writeFileSync(dbUrlPath, connectionString, "utf-8");

  try {
    await $`vercel env rm DATABASE_URL production -t ${vercelToken} --scope ${vercelOrgId} --yes`;
  } catch {}

  await $`vercel env add DATABASE_URL production < ${dbUrlPath} -t ${vercelToken} --scope ${vercelOrgId} --yes`;
  await $`vercel deploy -t ${vercelToken} --scope ${vercelOrgId} -e DATABASE_URL=${connectionString} --prod`;
  log("deploy successful!");
});
