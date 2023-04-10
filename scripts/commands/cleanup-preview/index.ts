import { $ } from "zx";

import { step, pkgJson } from "../../utils";
import { SecretKeys, SecretsManager } from "../../secrets";

const secrets = new SecretsManager();

const dbName = pkgJson.name;

const pscaleServiceToken = secrets.readSecret(SecretKeys.PlanetScale);
const pscaleServiceTokenId = secrets.readSecret(SecretKeys.PlanetScaleTokenId);
const pscaleOrg = secrets.readSecret(SecretKeys.PlanetScaleOrg);

const branch = await step("get branch", async () => {
  const [, , branch] = process.argv;

  if (!branch) throw new Error("missing branch to clean");

  return branch;
});

$.verbose = true;

await step("deleting branch", async () => {
  await $`pscale branch delete ${dbName} ${branch} --service-token ${pscaleServiceToken} --service-token-id ${pscaleServiceTokenId} --org ${pscaleOrg} --force`;
});
