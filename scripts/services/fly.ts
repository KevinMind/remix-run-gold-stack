import type { ProcessOutput } from "zx";
import { $, fs } from "zx";
import tomml from "toml";

import { log, logImportant } from "../utils";

export function getFlyAppName() {
  const flyToml = fs.readFileSync("../fly.toml", "utf-8");

  const result = tomml.parse(flyToml);

  const appName = result.app;

  if (!appName) {
    throw new Error("app name is required");
  }

  const dbName = `${appName}-db`;

  return { appName, dbName };
}

export async function flyAppDelete(appName: string) {
  $.verbose = false;
  try {
    await $`flyctl destroy ${appName} --yes`;
  } catch (error) {
    if ((error as ProcessOutput).stderr.includes("Error Could not find App"))
      return;

    throw error;
  }
}

export async function getApps() {
  $.verbose = false;

  const flyAppList = await $`flyctl apps list --json`;

  return JSON.parse(flyAppList.stdout);
}

export async function getFlyApp(appName: string) {
  const existingApps = await getApps();

  return existingApps.find((app: any) => app.ID === appName);
}

export async function flyCreateApp(appName: string) {
  log(`creating app: ${appName}`);
  $.verbose = false;
  await $`fly apps create ${appName}`;
    await $`fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app ${appName}`;
}

interface DbInfo {
  userName: string;
  password: string;
  port: number;
  hostname: string;
}

function extractPostgresInfo(input: string, dbName: string): DbInfo {
  const userName = /Username:\s+(\w+)/.exec(input)?.[1];
  const password = /Password:\s+(\w+)/.exec(input)?.[1];
  const port = /Postgres port:\s+(\d+)/.exec(input)?.[1];

  if (!userName || !password || !port)
    throw new Error("could not parse postgress info");

  return {
    userName,
    password,
    port: parseInt(port),
    hostname: `${dbName}.fly.dev`,
  };
}

function flyDbConnectionString({
  userName,
  password,
  hostname,
  port,
}: DbInfo) {
  return `postgres://${userName}:${password}@${hostname}:${port}`;
}

export async function flyCreateDB(appName: string, dbName: string) {
  $.verbose = false;
  const region = "ams";
  const volumeSize = 1;
  const initialClusterSize = 1;
  const vmSize = "shared-cpu-1x";

  log(`creating database ${dbName} for ${appName}...`);

    const dbCreateResult =
      await $`fly postgres create --name ${dbName} --region ${region} --volume-size ${volumeSize} --initial-cluster-size ${initialClusterSize} --vm-size ${vmSize} `;

    log("attatching databse to app...");

    await $`fly postgres attach --app ${appName} ${dbName}`;

    const dbInfo = extractPostgresInfo(dbCreateResult.stdout, dbName);

    log("allocating public ip address...");

    await $`fly ips allocate-v4 --app ${dbName} --yes`;

    logImportant(`connection string: ${flyDbConnectionString(dbInfo)}`);
}

export async function flySetSecret(
  appName: string,
  key: string,
  value: string
) {
  $.verbose = false;
  await $`flyctl secrets set ${key}=${value} --app ${appName} --detach`;
}

export async function flyUnsetSecret(appName: string, key: string) {
  $.verbose = false;
  await $`flyctl secrets unset ${key} --app ${appName} --detach`;
}

export default async function flyLogin(attempts = 0): Promise<string> {
  if (attempts > 3) throw new Error("too many attempts to get token");

  try {
    $.verbose = false;
    const result = await $`flyctl auth token`;

    return result.stdout;
  } catch (error) {
    // TODO fix error any
    if ((error as any).exitCode === 1) {
      $.verbose = true;
      await $`flyctl auth login`;

      return flyLogin(attempts + 1);
    }
    throw error;
  }
}
