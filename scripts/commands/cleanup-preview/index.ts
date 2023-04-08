import { $ } from "zx";
import invariant from "tiny-invariant";

import { step, pkgJson } from "../../utils";
import { env } from "../../env";

const dbName = pkgJson.name;

let pscaleServiceToken: string;
let pscaleServiceTokenId: string;
let pscaleOrg: string;

await step("validate env", async () => {
  invariant(env.PLANETSCALE_ORG);
  invariant(env.PLANETSCALE_SERVICE_TOKEN);
  invariant(env.PLANETSCALE_SERVICE_TOKEN_ID);

  pscaleServiceToken = env.PLANETSCALE_SERVICE_TOKEN;
  pscaleServiceTokenId = env.PLANETSCALE_SERVICE_TOKEN_ID;
  pscaleOrg = env.PLANETSCALE_ORG;
});

const branch = await $`git rev-parse --abbrev-ref HEAD`;

$.verbose = true;

await step("deleting branch", async () => {
  await $`pscale branch delete ${dbName} ${branch} --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId} --org ${pscaleOrg} --force`;
});
