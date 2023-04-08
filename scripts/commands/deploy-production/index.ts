import { $ } from "zx";
import invariant from "tiny-invariant";

import { step, log } from "../../utils";
import { env } from "../../env";

let vercelToken: string;
let vercelOrgId: string;
let vercelProjectId: string;

await step("validate env", async () => {
  invariant(env.VERCEL_ACCESS_TOKEN);
  invariant(env.VERCEL_ORG_ID);
  invariant(env.VERCEL_PROJECT_ID);

  vercelOrgId = env.VERCEL_ORG_ID;
  vercelProjectId = env.VERCEL_PROJECT_ID;
  vercelToken = env.VERCEL_ACCESS_TOKEN;
});

$.verbose = true;

await step("deploy production", async () => {
  log(`deploying project: ${vercelProjectId} org: ${vercelOrgId}`);
  await $`vercel deploy -t ${vercelToken} --scope ${vercelOrgId} --prod`;
});
