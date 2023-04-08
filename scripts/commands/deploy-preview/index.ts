import { $, ProcessOutput } from "zx";
import invariant from "tiny-invariant";

import { step, pkgJson } from "../../utils";
import { env } from "../../env";
import { log } from "console";

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

const branch = await $`git rev-parse --abbrev-ref HEAD`;

$.verbose = true;

// await step('deleting branch', async () => {
//   await $`pscale branch delete ${dbName} ${branch} --force`;
// });

await step("deploy db branch", async () => {
  try {
    await $`pscale branch show ${dbName} ${branch} --format json --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId}`;
    log(`found branch ${branch}`);
  } catch (error) {
    if (error instanceof ProcessOutput) {
      if (error.stderr.includes("does not exist in database")) {
        await step("creating branch", async () => {
          return await $`pscale branch create ${dbName} ${branch} --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId} --wait`;
        });
      }
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

await step("deploy preview", async () => {
  log(`project: ${vercelProjectId} org: ${vercelOrgId}`);
  await $`vercel pull --yes --environment=preview -t ${vercelToken} --scope ${vercelOrgId}`;
  await $`vercel deploy -t ${vercelToken} --scope ${vercelOrgId} -e DATABASE_URL=${connectionString}`;
});
