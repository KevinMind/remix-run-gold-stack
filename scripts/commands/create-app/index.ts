#!/usr/bin/env zx

import { log, getEnv, step } from "../../utils";
import auth0Login, {
  createAuthZeroApp,
  getAuthZeroClientId,
  getAuthZeroClientSecret,
  updateAuthZeroCallbackUrl,
} from "../../services/auth0";
import flyLogin, {
  flyCreateApp,
  flyCreateDB,
  flySetSecret,
  getFlyApp,
  getFlyAppName,
} from "../../services/fly";

await step("fly login", flyLogin);

const { appName, dbName } = getFlyAppName();

await step("create fly app", async () => {
  const flyApp = await getFlyApp(appName);

  if (flyApp) {
    log(`found app: ${appName} in fly no need to create`);

    return;
  }

  await flyCreateApp(appName);

  log(`created app: ${appName}`);
});

await step("create fly db app", async () => {
  const dbApp = await getFlyApp(dbName);

  if (dbApp) {
    return log(`found db: ${dbName}`);
  }

  await flyCreateDB(appName, dbName);

  return log(`created db: ${dbName}`);
});

await step("create an auth0 production app", async () => {
  await auth0Login();

  const authZeroProductionName = `${appName}-production`;

  const foundAuthZeroApp = await getAuthZeroClientId(authZeroProductionName);

  let clientId;
  let clientSecret;

  const authZeroDomain = getEnv("AUTH_ZERO_DOMAIN");

  if (foundAuthZeroApp) {
    log("auth zero production app exists already...");

    clientSecret = await getAuthZeroClientSecret(foundAuthZeroApp);

    clientId = foundAuthZeroApp;
  } else {
    const app = await createAuthZeroApp(authZeroProductionName);

    clientId = app.clientId;
    clientSecret = app.clientSecret;
  }

  const baseURL = `https://${appName}.fly.dev/auth/callback`;

  updateAuthZeroCallbackUrl(baseURL, clientId);

  await flySetSecret(appName, "AUTH_ZERO_DOMAIN", authZeroDomain);
  await flySetSecret(appName, "AUTH_ZERO_CLIENT_ID", clientId);
  await flySetSecret(appName, "AUTH_ZERO_CLIENT_SECRET", clientSecret);
  await flySetSecret(appName, "AUTH_ZERO_CALLBACK_URL", baseURL);
});
