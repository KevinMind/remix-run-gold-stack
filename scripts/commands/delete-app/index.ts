import { step } from "../../utils";
import flyLogin, { flyAppDelete, getFlyAppName } from "../../services/fly";
import { deleteAuthZeroApp } from "../../services/auth0";

const { appName, dbName } = getFlyAppName();

const authZeroProductionName = `${appName}-production`;

await flyLogin();

await step(`deleting '${appName}'`, async () => {
  return flyAppDelete(appName);
});

await step(`deleting '${dbName}'`, async () => {
  return flyAppDelete(dbName);
});

await step("removing auth0 production app", async () => {
  await deleteAuthZeroApp(authZeroProductionName);
});
