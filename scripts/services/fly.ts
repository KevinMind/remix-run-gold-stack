import { $ } from "zx";
import { log } from "../utils";

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
  $.verbose = true;
  await $`fly apps create ${appName}`;
  await $`fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app ${appName}`;
}

export async function flyCreateDB(appName: string, dbName: string) {
  $.verbose = true;
  const region = "ams";
  const volumeSize = 1;
  const initialClusterSize = 1;
  const vmSize = "shared-cpu-1x";

  log(`creating database ${dbName} for ${appName}`);
  await $`fly postgres create --name ${dbName} --region ${region} --volume-size ${volumeSize} --initial-cluster-size ${initialClusterSize} --vm-size ${vmSize} `;
  await $`fly postgres attach --app ${appName} ${dbName}`;
}

export async function flySetSecret(
  appName: string,
  key: string,
  value: string
) {
  await $`flyctl secrets set ${key}=${value} --app ${appName} --detach`;
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
