#!/usr/bin/env zx

import { $, fs } from "zx";
import tomml from "toml";
import { log, getEnv, step } from "../../utils";
import auth0Login, {
  getAuthZeroApps,
  updateAuthZeroCallbackUrl,
} from "../../services/auth0";
import flyLogin, {
  flyCreateApp,
  flyCreateDB,
  flySetSecret,
  getFlyApp,
} from "../../services/fly";

await step("fly login", flyLogin);

const flyToml = fs.readFileSync("../fly.toml", "utf-8");

const result = tomml.parse(flyToml);

const appName = result.app;

if (!appName) {
  throw new Error("app name is required");
}

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
  const dbName = `${appName}-db`;

  const dbApp = await getFlyApp(dbName);

  if (dbApp) {
    return log(`found db: ${dbName}`);
  }

  await flyCreateDB(appName, dbName);

  return log(`created db: ${dbName}`);
});

await step("create an auth0 production app", async () => {
  await auth0Login();

  const authZeroApps = await getAuthZeroApps();

  const authZeroProductionName = `${appName}-production`;

  const foundAuthZeroApp = authZeroApps.find(
    (app: any) => app.name === authZeroProductionName
  );

  let clientId;
  let clientSecret;

  const authZeroDomain = getEnv("AUTH_ZERO_DOMAIN");

  $.verbose = false;

  if (foundAuthZeroApp) {
    log("auth zero production app exists already...");

    const result =
      await $`auth0 apps show ${foundAuthZeroApp.clientId} --format json --reveal`;

    const app = JSON.parse(result.stdout);

    clientId = app["client_id"];
    clientSecret = app["client_secret"];
  } else {
    const result =
      await $`auth0 apps create -n ${authZeroProductionName} -t regular --reveal --format json`;

    const app = JSON.parse(result.stdout);

    clientId = app["client_id"];
    clientSecret = app["client_secret"];
  }

  const baseURL = `https://${appName}.fly.dev/auth/callback`;

  updateAuthZeroCallbackUrl(baseURL, clientId);

  $.verbose = true;
  await flySetSecret(appName, "AUTH_ZERO_DOMAIN", authZeroDomain);
  await flySetSecret(appName, "AUTH_ZERO_CLIENT_ID", clientId);
  await flySetSecret(appName, "AUTH_ZERO_CLIENT_SECRET", clientSecret);
  await flySetSecret(appName, "AUTH_ZERO_CALLBACK_URL", baseURL);
});
