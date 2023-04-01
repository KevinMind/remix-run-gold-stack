#!/usr/bin/env zx

import { $, chalk } from "zx";
import { setEnv, getEnv, log } from "../utils";
import choice from "cli-select";

function parseDeviceConfirmationCode(input: string) {
  const urlMatch = input.match(/Open the following URL in a browser: (\S+)/);

  const tenantMatch = input.match(/Tenant: (\S+)/);

  if (!urlMatch || !tenantMatch) {
    throw new Error("Input does not contain required information");
  }

  return {
    loginUrl: urlMatch[1],
    tenant: tenantMatch[1],
  };
}

export async function isLoggedIn() {
  const authZeroDomain = getEnv("AUTH_ZERO_DOMAIN");

  if (authZeroDomain?.length) {
    try {
      $.verbose = false;
      await $`auth0 tenants list`;

      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

export async function getAuthZeroApps(): Promise<
  { name: string; clientId: string }[]
> {
  const allApps = await $`auth0 apps list --format json`;

  const apps = JSON.parse(allApps.stdout).map((app: any) => ({
    name: app.name,
    clientId: app.client_id,
  }));

  return apps;
}

export async function createAuthZeroApp(appName: string) {
  const result =
    await $`auth0 apps create -n ${appName} -t regular --reveal --format json`;

  const app = JSON.parse(result.stdout);

  return {
    clientId: app["client_id"],
    clientSecret: app["client_secret"],
  };
}

export async function deleteAuthZeroApp(appName: string) {
  const clientId = await getAuthZeroClientId(appName);
  $.verbose = false;
  await $`auth0 apps delete ${clientId}`;
}

export async function getAuthZeroClientId(appName?: string) {
  const apps = await getAuthZeroApps();

  if (appName) {
    const app = apps.find((app) => app.name === appName);

    return app?.clientId;
  }

  log("Select auth0 app to use");

  const selectedApp = await choice<number>({
    values: apps.reduce(
      (acm, key, idx) => ({
        ...acm,
        [key.name]: idx,
      }),
      {}
    ),
    valueRenderer: (value, selected) => {
      const text = chalk.black(value.toString());
      if (selected) {
        return chalk.bold(chalk.underline(text));
      }
      return text;
    },
  });

  const app = apps[selectedApp.value];

  log(`selected: ${app.name}`);

  const clientId = app.clientId;

  return clientId;
}

export async function getAuthZeroClientSecret(clientId: string) {
  function parseKeyValues(input: string) {
    const result: { [key: string]: string } = {};

    // Split the input string into lines
    const lines = input.split("\n");

    // Iterate through each line
    for (const line of lines) {
      // Use a regular expression to match a key-value pair
      const match = line.match(/([A-Z\s]+)\s+(.+)/);

      if (match) {
        const key = match[1].replace(/\s+/g, "_").trim();
        const value = match[2].trim();
        result[key] = value;
      }
    }

    return result;
  }

  const appInfo = await $`auth0 apps show ${clientId} -r`;

  const config = parseKeyValues(appInfo.stdout);

  const clientSecret = config["_CLIENT_SECRET_"];

  return clientSecret;
}

export function createAuthZeroCallbackUrl(baseUrl: string, port: string) {
  const url = new URL(baseUrl);

  url.host = `${port}-${url.host}`;
  url.pathname = "/auth/callback";

  return url;
}

export async function updateAuthZeroCallbackUrl(
  callbackUrl: string,
  clientId: string
) {
  await $`auth0 apps update ${clientId} -c ${callbackUrl}`;
}

export default async function auth0Login() {
  if (await isLoggedIn()) {
    return;
  }

  $.verbose = true;
  const result = await $`auth0 login --no-input`;

  const data = parseDeviceConfirmationCode(result.stderr);

  setEnv("AUTH_ZERO_DOMAIN", data.tenant);
}
